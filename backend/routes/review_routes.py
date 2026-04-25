from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models import Review
from schemas import ReviewCreate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/")
async def create_review(review: ReviewCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_review = Review(
            role=review.role,
            overall=review.overall,
            categories=review.categories or {},
            comment=review.comment,
            userName=review.userName,
            source=review.source
        )
        db.add(db_review)
        await db.commit()
        await db.refresh(db_review)
        return {"status": "success", "id": db_review.id}
    except Exception as e:
        logger.error(f"Failed to save review: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while saving review")

@router.get("/")
async def get_reviews(db: AsyncSession = Depends(get_db)):
    # Optional endpoint to view reviews (useful for admin)
    from sqlalchemy.future import select
    result = await db.execute(select(Review).order_by(Review.created_at.desc()))
    return result.scalars().all()
