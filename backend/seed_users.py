import asyncio
from database import AsyncSessionLocal, engine, Base
from models import User
from auth import get_password_hash

async def seed_users():
    # Make sure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # 1. Dummy ASHA Worker
        asha = User(
            employee_id="ASHA001",
            role="asha",
            password_hash=get_password_hash("password"),
            full_name="Kalyani Dash",
            location="Village Alpha",
            district="Puri"
        )
        
        # 2. Dummy District Officer (THO)
        tho = User(
            employee_id="THO001",
            role="tho",
            password_hash=get_password_hash("password"),
            full_name="Dr. Pradhan",
            location="District HQ",
            district="Puri"
        )
        
        # 3. Dummy Admin
        admin = User(
            employee_id="ADMIN001",
            role="admin",
            password_hash=get_password_hash("password"),
            full_name="System Admin",
            location="State HQ",
            district="All"
        )
        
        session.add(asha)
        session.add(tho)
        session.add(admin)
        await session.commit()
        print("Successfully added dummy users:")
        print("1. ASHA Worker -> ID: ASHA001 | Pass: password")
        print("2. District Officer -> ID: THO001 | Pass: password")
        print("3. Admin -> ID: ADMIN001 | Pass: password")

if __name__ == "__main__":
    asyncio.run(seed_users())
