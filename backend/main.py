import os
import sys
import json
import base64
import logging
import httpx
import numpy as np
import cv2
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.websockets import WebSocket, WebSocketDisconnect
from openai import OpenAI
from dotenv import load_dotenv

# Add backend folder to path
_BACKEND_PATH = os.path.dirname(__file__)
if _BACKEND_PATH not in sys.path:
    sys.path.insert(0, os.path.abspath(_BACKEND_PATH))

# ISL detector — path relative to backend/
_ISL_PATH = os.path.join(os.path.dirname(__file__), "..", "isl_feature", "inference")
if _ISL_PATH not in sys.path:
    sys.path.insert(0, os.path.abspath(_ISL_PATH))

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from database import engine, Base, AsyncSessionLocal
from models import TriageRecord
from routes import auth_routes, patient_routes, triage_routes, user_routes, outbreak_routes
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://swasthsetu.in",
        "https://www.swasthsetu.in",
        "https://swasthsethu.in",
        "https://www.swasthsethu.in",
        "https://swasthya-setu-full-git-main-nullpointer-cells-projects.vercel.app",
        "https://swasthya-setu-full.onrender.com",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register new routers
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(patient_routes.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(triage_routes.router, prefix="/api/v1/triage_records", tags=["Triage Records"])
app.include_router(outbreak_routes.router, prefix="/api/v1/outbreaks", tags=["Outbreaks"])
from routes import review_routes
app.include_router(review_routes.router, prefix="/api/v1/reviews", tags=["Reviews"])

from sqlalchemy.future import select
from sqlalchemy import text
from models import User
from auth import get_password_hash

@app.on_event("startup")
async def startup():
    logger.info("Backend startup - initializing database metadata")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # Simple manual migration for 'tehsil' columns
            # Wrap in try/except because 'ADD COLUMN' will fail if it already exists
            logger.info("Checking for database migrations...")
            try:
                await conn.execute(text("ALTER TABLE patients ADD COLUMN tehsil VARCHAR"))
                logger.info("Added 'tehsil' column to patients table")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    logger.info("Column 'tehsil' already exists in patients table")
                else:
                    logger.warning(f"Note: patients table migration check: {e}")

            try:
                await conn.execute(text("ALTER TABLE triage_records ADD COLUMN tehsil VARCHAR"))
                logger.info("Added 'tehsil' column to triage_records table")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    logger.info("Column 'tehsil' already exists in triage_records table")
                else:
                    logger.warning(f"Note: triage_records table migration check: {e}")

            # Reviews table migrations
            try:
                await conn.execute(text("ALTER TABLE reviews ADD COLUMN userName VARCHAR"))
                await conn.execute(text("ALTER TABLE reviews ADD COLUMN designation VARCHAR"))
                await conn.execute(text("ALTER TABLE reviews ADD COLUMN location VARCHAR"))
                logger.info("Added missing columns to reviews table")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    logger.info("Columns already exist in reviews table")
                else:
                    logger.info(f"Reviews table migration check: {e}")

        async with AsyncSessionLocal() as session:
            # Check if reviews table is empty
            try:
                from models import Review
                result = await session.execute(select(Review).limit(1))
                if not result.scalar_one_or_none():
                    logger.info("Reviews table empty! Seeding initial reviews...")
                    session.add_all([
                        Review(
                            userName="Kalyani Dash", role="asha", designation="ASHA Worker",
                            location="Village Alpha, Odisha", overall=5,
                            comment="Swasthya Setu has made my daily home visits so much more organized. The offline mode is a lifesaver in our village.",
                            source="seed"
                        ),
                        Review(
                            userName="Dr. Ramesh Pradhan", role="tho", designation="Block Medical Officer",
                            location="Bhubaneswar", overall=5,
                            comment="The real-time tracking of disease outbreaks in my block allows us to deploy resources much faster than before. Truly a game changer.",
                            source="seed"
                        ),
                        Review(
                            userName="Meena Kumari", role="asha", designation="ASHA Worker",
                            location="Village Beta, Odisha", overall=4,
                            comment="The voice triage feature helps me record symptoms quickly even when I am busy with patients. Highly recommended!",
                            source="seed"
                        )
                    ])
                    await session.commit()
                    logger.info("Reviews seeded.")
            except Exception as e:
                logger.error(f"Failed to seed reviews: {e}")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.warning("Backend will run without database connectivity.")

# Initialize clients with error handling
try:
    openai_client = OpenAI(api_key=os.getenv("OPENAI_KEY"))
    logger.info("OpenAI client initialized")
except Exception as e:
    logger.error(f"OpenAI init failed: {e}")
    openai_client = None

TRIAGE_SYSTEM_PROMPT = """
You are a rural healthcare triage assistant for ASHA workers
in Odisha, India. Apply WHO IMNCI triage rules.

RED (Emergency - refer immediately):
- Unable to drink or feed
- Convulsions or fits
- Abnormally sleepy or unconscious
- High fever with stiff neck
- Severe chest indrawing
- Severe malnutrition
- Infant under 2 months with any danger sign

YELLOW (Moderate - treat and monitor):
- Fever for 2-3 days without danger signs
- Fast breathing without severe signs
- Moderate dehydration
- Not eating normally

GREEN (Mild - home care):
- Mild cough or cold
- No danger signs
- Feeding normally

ODISHA SICKLE CELL RULE:
If district is in [Koraput, Malkangiri, Rayagada, Kalahandi,
Kandhamal, Nabarangpur, Mayurbhanj] AND symptoms include
fever AND (joint pain OR fatigue OR jodo dard OR thakaan):
Force severity=red, sickle_cell_risk=true

Return ONLY valid JSON no markdown:
{"symptoms": [], "severity": "green|yellow|red",
 "sickle_cell_risk": false, "brief": ""}
"""


@app.get("/health")
async def health():
    return {"status": "ok", "service": "swasthya-setu-backend"}


MAHARASHTRA_THOS = [
    ("THO001", "Dr. Pradhan",  "Pune"),
    ("THO002", "Dr. Sharma",   "Mumbai"),
    ("THO003", "Dr. Kulkarni", "Nagpur"),
    ("THO004", "Dr. Deshmukh", "Nashik"),
    ("THO005", "Dr. Patil",    "Ahmednagar"),
    ("THO006", "Dr. Jadhav",   "Aurangabad"),
    ("THO007", "Dr. More",     "Solapur"),
    ("THO008", "Dr. Shinde",   "Kolhapur"),
    ("THO009", "Dr. Bhosale",  "Thane"),
    ("THO010", "Dr. Pawar",    "Satara"),
    ("THO011", "Dr. Chavan",   "Sangli"),
]

@app.post("/api/v1/migrate-maharashtra-thos")
async def migrate_maharashtra_thos():
    """One-time migration: upsert Maharashtra THO accounts."""
    async with AsyncSessionLocal() as session:
        created, updated = [], []
        for emp_id, name, district in MAHARASHTRA_THOS:
            result = await session.execute(select(User).where(User.employee_id == emp_id))
            existing = result.scalar_one_or_none()
            if existing:
                existing.full_name = name
                existing.district = district
                existing.location = "District HQ"
                updated.append(emp_id)
            else:
                session.add(User(
                    employee_id=emp_id, role="tho",
                    password_hash=get_password_hash("password"),
                    full_name=name, location="District HQ", district=district
                ))
                created.append(emp_id)
        await session.commit()
    return {"created": created, "updated": updated}


@app.post("/incoming-call")
async def incoming_call(request: Request):
    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">
        Namaste. Swasthya Setu mein aapka swagat hai.
        Beep ke baad apne lakshan batayein.
        Aapki recording save ho jayegi.
    </Say>
    <Record
        maxLength="60"
        action="/webhook/call"
        recordingStatusCallback="/webhook/call"
        transcribe="false"
        playBeep="true"
    />
</Response>"""
    return PlainTextResponse(content=twiml, media_type="application/xml")


@app.post("/webhook/call")
async def webhook_call(request: Request):
    try:
        form_data = await request.form()
        caller_phone = form_data.get("From", "unknown")
        call_sid = form_data.get("CallSid", "")
        logger.info(f"Call received from {caller_phone}")

        # Download audio from Twilio
        audio_bytes = None
        if recording_url:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        recording_url + ".mp3",
                        auth=(
                            os.getenv("TWILIO_ACCOUNT_SID"),
                            os.getenv("TWILIO_AUTH_TOKEN")
                        ),
                        timeout=30.0
                    )
                    audio_bytes = response.content
                    logger.info(f"Audio downloaded: {len(audio_bytes)} bytes")
            except Exception as e:
                logger.error(f"Audio download failed: {e}")

        # Transcribe with Whisper
        original_transcript = ""
        if audio_bytes and openai_client:
            try:
                result = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("recording.mp3", audio_bytes, "audio/mpeg"),
                    language="or"
                )
                original_transcript = result.text
                logger.info(f"Transcript: {original_transcript}")
            except Exception as e:
                logger.error(f"Whisper failed: {e}")
                original_transcript = "Transcription failed"

        # Translate to 3 languages
        translations = {
            "english": original_transcript,
            "hindi": original_transcript,
            "odia": original_transcript
        }
        if original_transcript and openai_client:
            try:
                translation_response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{
                        "role": "user",
                        "content": f"""Translate this text to English, Hindi, and Odia.
Return ONLY valid JSON no markdown:
{{"english": "translation", "hindi": "translation", "odia": "translation"}}
Text: {original_transcript}"""
                    }],
                    response_format={"type": "json_object"}
                )
                translations = json.loads(
                    translation_response.choices[0].message.content
                )
                logger.info("Translations done")
            except Exception as e:
                logger.error(f"Translation failed: {e}")

        # Run IMNCI triage
        triage_result = {
            "symptoms": [],
            "severity": "yellow",
            "sickle_cell_risk": False,
            "brief": "Unable to process triage"
        }
        if translations.get("english") and openai_client:
            try:
                triage_response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
                        {"role": "user", "content": translations["english"]}
                    ],
                    response_format={"type": "json_object"}
                )
                triage_result = json.loads(
                    triage_response.choices[0].message.content
                )
                logger.info(f"Triage: {triage_result}")
            except Exception as e:
                logger.error(f"Triage failed: {e}")

        # Save to DB
        try:
            async with AsyncSessionLocal() as db:
                db_record = TriageRecord(
                    patient_name=f"Caller {caller_phone[-4:]}",
                    caller_phone=caller_phone,
                    call_sid=call_sid,
                    source="helpline_call",
                    transcript=original_transcript,
                    symptoms=triage_result.get("symptoms", []),
                    severity=triage_result.get("severity", "yellow"),
                    sickle_cell_risk=triage_result.get("sickle_cell_risk", False),
                    brief=triage_result.get("brief", ""),
                    reviewed=False
                )
                db.add(db_record)
                await db.commit()
                logger.info("Saved to Database")
        except Exception as e:
            logger.error(f"Database save failed: {e}")

        # Return TwiML voice response
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">
        Aapka sandesh record ho gaya hai.
        Swasthya Setu team aapse jald sampark karegi.
        Dhanyavaad.
    </Say>
</Response>"""
        return PlainTextResponse(content=twiml, media_type="application/xml")

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">
        Kripya baad mein call karein.
    </Say>
</Response>"""
        return PlainTextResponse(content=twiml, media_type="application/xml")


# ── ISL WebSocket endpoint ────────────────────────────────────────────────────
@app.websocket("/ws/isl")
async def isl_detect(websocket: WebSocket):
    """
    WebSocket endpoint for real-time ISL detection (v2.0).

    Client sends JSON:
      { "type": "frame",   "image": "<base64 JPEG>" }
      { "type": "reset" }
      { "type": "profile", "demographic": "women|men|child|elderly" }

    Server replies JSON per frame:
      {
        "sign":              "BUKHAR" | null,
        "english":           "Bukhar" | null,
        "hindi":             "बुखार" | null,
        "icd10":             "R50.9" | null,
        "urgency":           "high" | "medium" | "critical" | "unknown",
        "confidence":        0.0-1.0,
        "confirmed":         true/false,
        "escalate":          true/false,
        "fill":              0.0-1.0,
        "has_hand":          true/false,
        "cardiac_emergency": true/false,
        "all_confidences":   { "BUKHAR": 0.92, ... },
        "demographic":       "men",
        "model_notes":       ""
      }
    """
    await websocket.accept()
    logger.info("ISL WebSocket connected")

    # Lazy-load detector (only when first client connects)
    try:
        from isl_detector import ISLDetector
        detector = ISLDetector()
    except Exception as e:
        logger.error(f"ISLDetector load failed: {e}")
        await websocket.send_json({"error": str(e)})
        await websocket.close()
        return

    try:
        while True:
            data    = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "reset":
                detector.reset()
                await websocket.send_json({"reset": True})
                continue

            if payload.get("type") == "profile":
                demographic = payload.get("demographic", "men")
                detector.set_demographic(demographic)
                await websocket.send_json({"profile_set": demographic})
                continue

            if payload.get("type") == "frame":
                try:
                    img_bytes = base64.b64decode(payload["image"])
                    np_arr    = np.frombuffer(img_bytes, np.uint8)
                    frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                    if frame is None:
                        continue
                    result = detector.process_frame(frame)
                    await websocket.send_json(result)
                except Exception as e:
                    logger.error(f"ISL frame error: {e}")
                    await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        logger.info("ISL WebSocket disconnected")
        detector.close()
    except Exception as e:
        logger.error(f"ISL WebSocket error: {e}")
        detector.close()
