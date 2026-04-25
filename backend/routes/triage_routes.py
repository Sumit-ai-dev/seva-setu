from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import httpx
import logging

from database import get_db
from models import TriageRecord
from schemas import TriageCreate
from auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/")
async def get_triage_records(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(TriageRecord).order_by(TriageRecord.created_at.desc())
    if current_user["role"] == "asha":
        query = query.where(TriageRecord.user_id == current_user["id"])
    elif current_user["role"] == "tho" and current_user.get("district"):
        query = query.where(TriageRecord.district == current_user["district"])
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/")
async def create_triage_record(record: TriageCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_record = TriageRecord(
        patient_id=record.patient_id,
        patient_name=record.patient_name,
        symptoms=record.symptoms,
        severity=record.severity,
        sickle_cell_risk=record.sickle_cell_risk,
        brief=record.brief,
        tehsil=record.tehsil,
        district=record.district,
        latitude=record.latitude,
        longitude=record.longitude,
        user_id=current_user["id"],
        source="app"
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return db_record

@router.patch("/{record_id}/reviewed")
async def mark_triage_reviewed(record_id: str, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user["role"] != "tho":
        raise HTTPException(status_code=403, detail="Only THO can review records")

    query = select(TriageRecord).where(TriageRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    record.reviewed = True
    await db.commit()
    return {"success": True}


@router.post("/ai-suggestion")
async def get_ai_suggestion(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Get AI medical suggestions using Google Gemini API.
    """
    try:
        symptoms = request.get("symptoms", [])
        severity = request.get("severity", "moderate")
        patient_gender = request.get("patient_gender", "unknown")
        patient_age = request.get("patient_age", 0)

        if not symptoms:
            raise HTTPException(status_code=400, detail="Symptoms required")

        # Format symptoms for the prompt
        symptoms_text = ", ".join(symptoms)

        # Create prompt with demographic context
        demographic_context = f"Patient: {patient_age} years old, {patient_gender}"

        prompt = f"""You are a medical assistant for rural healthcare workers in India. Provide exactly 3 short, actionable medical suggestions based on this info:

{demographic_context}
Symptoms: {symptoms_text}
Current severity assessment: {severity}

STRICT RESTRICTIONS:
- Maximum 3 bullet points.
- Maximum 15 words per bullet point.
- Be extremely brief and direct.
- Do NOT provide a definitive diagnosis.
- Do NOT add a long disclaimer at the end.

Suggestions:"""

        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logger.error("GEMINI_API_KEY not configured")
            raise HTTPException(status_code=500, detail="AI service not configured")

        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=150,
                temperature=0.4
            )
        )
        suggestion = response.text.strip() if response.text else "Unable to generate suggestions"

        return {
            "success": True,
            "suggestion": suggestion,
            "symptoms": symptoms,
            "severity": severity,
            "demographic": {
                "age": patient_age,
                "gender": patient_gender
            }
        }

    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
