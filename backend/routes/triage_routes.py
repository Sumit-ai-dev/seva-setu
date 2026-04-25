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
    Get AI medical suggestions using Hugging Face model.

    Request body:
    {
        "symptoms": ["fever", "leg swelling"],
        "severity": "moderate",
        "patient_gender": "male/female/other",
        "patient_age": 35
    }
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

        prompt = f"""You are a medical assistant for rural healthcare workers in India. Provide 4-5 key medical suggestions based on the following information.

{demographic_context}
Symptoms: {symptoms_text}
Current severity assessment: {severity}

Important:
- Provide practical home care suggestions
- Consider gender-specific symptoms when relevant
- Include red flags/warning signs to watch for
- Be conservative and encourage professional medical care when needed
- Format as bullet points
- Do NOT provide definitive diagnosis
- Add appropriate disclaimers about seeking professional care

Suggestions:"""

        hf_token = os.getenv("HF_TOKEN")
        if not hf_token:
            logger.error("HF_TOKEN not configured")
            raise HTTPException(status_code=500, detail="AI service not configured")

        # Call Hugging Face Inference API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api-inference.huggingface.co/models/alpha-ai/LLAMA3-3B-Medical-COT",
                headers={"Authorization": f"Bearer {hf_token}"},
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 300,
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "do_sample": True
                    }
                }
            )

            if response.status_code != 200:
                logger.error(f"HF API error: {response.text}")
                raise HTTPException(status_code=500, detail="AI service error")

            result = response.json()

            # Extract generated text from response
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
                # Extract only the new suggestion part (after the prompt)
                if prompt in generated_text:
                    suggestion = generated_text.split(prompt)[-1].strip()
                else:
                    suggestion = generated_text
            else:
                suggestion = "Unable to generate suggestions"

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

    except httpx.TimeoutError:
        logger.error("HF API timeout")
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
