from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/", response_model=list[dict])
async def get_user_quests(db: AsyncSession = Depends(get_db)):
    """
    Calculates quest progress based on real verification data.
    """
    # 1. Pioneer Quest: verify 5 viral claims
    # For now, count total verdicts created by user (mocked as user_id 1)
    verdict_count_query = select(func.count()).select_from(models.Verdict)
    res = await db.execute(verdict_count_query)
    count = res.scalar() or 0
    
    # 2. Deepfake Hunter: identify 3 media manipulations
    # Count verdicts with media_forensics data
    # (Simplified for now: count verdicts where confidence > 90)
    high_conf_query = select(func.count()).select_from(models.Verdict).where(models.Verdict.confidence_score > 90)
    res_high = await db.execute(high_conf_query)
    high_count = res_high.scalar() or 0

    # 3. Dynamic Community Quests (Sentinel published)
    dynamic_quests_query = select(models.Quest).order_by(models.Quest.created_at.desc()).limit(10)
    res_dynamic = await db.execute(dynamic_quests_query)
    dynamic_quests = res_dynamic.scalars().all()
    
    quest_list = [
        {
            "id": 1,
            "title": "The Pioneer",
            "description": "Be the first to verify 5 viral claims on the network.",
            "reward": "Pioneer Badge (SBT)",
            "progress": min(100, int((count / 5) * 100)),
            "status": "active" if count < 5 else "completed"
        },
        {
            "id": 2,
            "title": "Deepfake Hunter",
            "description": "Identify 3 media manipulations with high-confidence forensic proof.",
            "reward": "Forensic Master Badge (SBT)",
            "progress": min(100, int((high_count / 3) * 100)),
            "status": "active" if high_count < 3 else "completed"
        },
        {
            "id": 3,
            "title": "DAO Guardian",
            "description": "Vote in 10 consecutive TruthDAO disputes with the majority.",
            "reward": "Oracle Badge (SBT)",
            "progress": 0,
            "status": "locked"
        }
    ]

    for q in dynamic_quests:
        quest_list.append({
            "id": f"q_{q.id}",
            "title": q.title,
            "description": q.description,
            "reward": q.reward,
            "progress": q.progress,
            "status": q.status
        })

    return quest_list
