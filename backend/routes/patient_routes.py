from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import Patient
from schemas import PatientCreate
from auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_patients(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Patient).order_by(Patient.created_at.desc())
    
    # Filter patients by district for ASHA and THO
    if current_user["role"] in ["asha", "tho"]:
        query = query.where(Patient.district == current_user["district"])
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/")
async def create_patient(patient: PatientCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_patient = Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        village=patient.village,
        tehsil=patient.tehsil,
        district=patient.district,
        pregnant=patient.pregnant,
        abha_id=patient.abha_id,
        user_id=current_user["id"]
    )
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)
    return new_patient
