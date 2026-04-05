import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import engine, SessionLocal, Base
from models import Source

INITIAL_SOURCES = [
    {
        "domain": "who.int",
        "name": "World Health Organization",
        "credibility_score": 100.0,
        "trust_level": 5,
        "description": "Global public health organization.",
        "is_verified_fact_checker": True
    },
    {
        "domain": "reuters.com",
        "name": "Reuters Fact Check",
        "credibility_score": 98.0,
        "trust_level": 5,
        "description": "International news organization.",
        "is_verified_fact_checker": True
    },
    {
        "domain": "snopes.com",
        "name": "Snopes",
        "credibility_score": 95.0,
        "trust_level": 5,
        "description": "Independent fact-checking organization.",
        "is_verified_fact_checker": True
    },
    {
        "domain": "politifact.com",
        "name": "PolitiFact",
        "credibility_score": 95.0,
        "trust_level": 5,
        "description": "Non-profit project operated by the Poynter Institute.",
        "is_verified_fact_checker": True
    },
    {
        "domain": "cdc.gov",
        "name": "Centers for Disease Control and Prevention",
        "credibility_score": 100.0,
        "trust_level": 5,
        "description": "National public health agency of the USA.",
        "is_verified_fact_checker": True
    }
]

async def init_db():
    async with engine.begin() as conn:
        # Create pgvector extension if not exists
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        
        # Create all tables
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created.")

async def seed_sources(session: AsyncSession):
    for source_data in INITIAL_SOURCES:
        source = Source(**source_data)
        session.add(source)
    await session.commit()
    print(f"Seeded {len(INITIAL_SOURCES)} sources.")

async def main():
    await init_db()
    async with SessionLocal() as session:
        await seed_sources(session)
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(main())
