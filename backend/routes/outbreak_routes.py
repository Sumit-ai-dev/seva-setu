from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from database import get_db
from models import DiseaseOutbreak
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

class OutbreakCreate(BaseModel):
    district: str
    disease: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    state: Optional[str] = "Karnataka"
    cases: Optional[int] = 1
    deaths: Optional[int] = 0

class OutbreakResponse(BaseModel):
    id: int
    year: Optional[int] = None
    week: Optional[int] = None
    state: Optional[str] = None
    district: Optional[str] = None
    disease: Optional[str] = None
    cases: Optional[int] = None
    deaths: Optional[int] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        orm_mode = True

@router.get("/", response_model=List[OutbreakResponse])
async def get_outbreaks(district: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(DiseaseOutbreak)
    if district:
        query = query.where(DiseaseOutbreak.district == district)
    
    result = await db.execute(query)
    outbreaks = result.scalars().all()
    return [OutbreakResponse.from_orm(o) for o in outbreaks]

@router.post("/", response_model=OutbreakResponse)
async def create_outbreak(data: OutbreakCreate, db: AsyncSession = Depends(get_db)):
    # Dedup: check if same district + disease was flagged today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    
    existing_query = select(DiseaseOutbreak).where(
        DiseaseOutbreak.district == data.district,
        DiseaseOutbreak.disease == data.disease,
        DiseaseOutbreak.created_at >= today_start,
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()
    
    if existing:
        # Increment case count instead of creating a duplicate
        existing.cases = (existing.cases or 1) + 1
        await db.commit()
        await db.refresh(existing)
        return OutbreakResponse.from_orm(existing)
    
    # Create new outbreak flag
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    iso_cal = now.isocalendar()
    
    outbreak = DiseaseOutbreak(
        year=iso_cal[0],
        week=iso_cal[1],
        state=data.state or "Karnataka",
        district=data.district,
        disease=data.disease,
        cases=data.cases or 1,
        deaths=data.deaths or 0,
        status="active",
        latitude=data.latitude,
        longitude=data.longitude,
        created_at=now,
    )
    db.add(outbreak)
    await db.commit()
    await db.refresh(outbreak)
    return OutbreakResponse.from_orm(outbreak)