from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from database import get_db
from models import User
from schemas import UserLogin, UserCreate
from auth import verify_password, get_password_hash, create_access_token

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, db: AsyncSession = Depends(get_db)):
    # 1. Look up user by employee_id
    query = select(User).where(User.employee_id == user_login.employee_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password",
        )

    # 2. Check password
    if not verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password",
        )

    # 3. Prevent cross-role login (e.g. ASHA trying THO layout)
    if user.role != user_login.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You are registered as '{user.role}', but tried to login as '{user_login.role}'. Please use the correct login portal.",
        )

    # 4. Generate JWT
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role, "employee_id": user.employee_id, "district": user.district}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "employee_id": user.employee_id,
            "role": user.role,
            "full_name": user.full_name,
            "location": user.location,
            "district": user.district,
            "avatar_b64": user.avatar_b64,
            "banner_b64": user.banner_b64
        }
    }

@router.post("/register")
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if exists
    query = select(User).where(User.employee_id == user_create.employee_id)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    new_user = User(
        employee_id=user_create.employee_id,
        role=user_create.role,
        password_hash=get_password_hash(user_create.password),
        full_name=user_create.full_name,
        location=user_create.location,
        district=user_create.district
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User registered successfully"}
