from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import User
from auth import get_current_user

router = APIRouter()

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.id == current_user["id"])
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "role": user.role,
        "full_name": user.full_name,
        "location": user.location,
        "district": user.district,
        "avatar_b64": user.avatar_b64,
        "banner_b64": user.banner_b64
    }

@router.patch("/profile")
async def update_my_profile(profile_data: dict, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.id == current_user["id"])
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if "full_name" in profile_data: user.full_name = profile_data["full_name"]
    if "location" in profile_data: user.location = profile_data["location"]
    if "avatar_b64" in profile_data: user.avatar_b64 = profile_data["avatar_b64"]
    if "banner_b64" in profile_data: user.banner_b64 = profile_data["banner_b64"]
    
    await db.commit()
    return {"message": "Profile updated successfully"}

@router.get("/asha")
async def get_asha_workers(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user["role"] != "tho":
        raise HTTPException(status_code=403, detail="Only THO can access ASHA worker list")
        
    # We will get all ASHA workers for now, or match on district if THO is assigned to one
    query = select(User).where(User.role == "asha")
    
    if current_user.get("district"):
        # Match the district if THO covers a specific district
        query = query.where(User.district == current_user["district"])
        
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "employee_id": u.employee_id,
            "full_name": u.full_name,
            "location": u.location,
            "district": u.district,
            "avatar_b64": u.avatar_b64
        }
        for u in users
    ]
