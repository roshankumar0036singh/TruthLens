from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
import models

async def get_verdicts_with_votes(db: AsyncSession, limit: int = 20):
    """
    Fetches recent verdicts along with aggregated up/down votes.
    """
    query = (
        select(models.Verdict)
        .options(selectinload(models.Verdict.claim), selectinload(models.Verdict.community_votes))
        .order_by(desc(models.Verdict.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    verdicts = result.scalars().all()
    
    formatted_verdicts = []
    for v in verdicts:
        upvotes = sum(1 for vote in v.community_votes if vote.vote == 1)
        downvotes = sum(1 for vote in v.community_votes if vote.vote == -1)
        formatted_verdicts.append({
            "id": v.id,
            "text": v.claim.text,
            "verdict": v.overall_verdict,
            "confidence": v.confidence_score,
            "timestamp": v.created_at.isoformat(),
            "upvotes": upvotes,
            "downvotes": downvotes
        })
    
    return formatted_verdicts

async def create_community_vote(db: AsyncSession, verdict_id: int, user_id: int, vote_value: int):
    """
    Adds a community vote. Handles updates if user already voted.
    """
    # Check for existing vote
    query = select(models.CommunityVote).where(
        models.CommunityVote.verdict_id == verdict_id,
        models.CommunityVote.user_id == user_id
    )
    result = await db.execute(query)
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        existing_vote.vote = vote_value
    else:
        new_vote = models.CommunityVote(
            verdict_id=verdict_id,
            user_id=user_id,
            vote=vote_value
        )
        db.add(new_vote)
    
    await db.commit()
    
    # Recalculate counts for response
    query_up = select(func.count()).select_from(models.CommunityVote).where(
        models.CommunityVote.verdict_id == verdict_id,
        models.CommunityVote.vote == 1
    )
    query_down = select(func.count()).select_from(models.CommunityVote).where(
        models.CommunityVote.verdict_id == verdict_id,
        models.CommunityVote.vote == -1
    )
    
    up_res = await db.execute(query_up)
    down_res = await db.execute(query_down)
    
    return {
        "verdict_id": verdict_id,
        "upvotes": up_res.scalar(),
        "downvotes": down_res.scalar(),
        "user_vote": vote_value
    }

async def get_global_stats(db: AsyncSession):
    """
    Calculates global platform metrics.
    """
    count_query = select(func.count()).select_from(models.Claim)
    avg_conf_query = select(func.avg(models.Verdict.confidence_score))
    voter_query = select(func.count(func.distinct(models.CommunityVote.user_id)))
    
    # Finding top misleading domain (simple logic)
    domain_query = (
        select(models.Source.domain, func.count())
        .join(models.Citation)
        .join(models.Verdict)
        .where(models.Verdict.overall_verdict == "FALSE")
        .group_by(models.Source.domain)
        .order_by(desc(func.count()))
        .limit(1)
    )
    
    counts = await db.execute(count_query)
    avg_conf = await db.execute(avg_conf_query)
    voters = await db.execute(voter_query)
    top_domain = await db.execute(domain_query)
    
    total_claims = counts.scalar() or 0
    active_voters = voters.scalar() or 0
    top_domain_row = top_domain.first()
    
    registry_nodes = (active_voters // 10) + 3
    consensus_ratio = 94.2 # Mocked for now, can be updated with real consensus data
    if total_claims > 0:
        consensus_ratio = min(99.0, 80.0 + (active_voters * 0.5))

    return {
        "total_claims_verified": total_claims,
        "average_confidence": round((avg_conf.scalar() or 0) * 100, 1),
        "top_misleading_domain": top_domain_row[0] if top_domain_row else "None",
        "active_voters_count": active_voters,
        "registry_nodes": registry_nodes,
        "consensus_ratio": round(consensus_ratio, 1)
    }
