from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import schemas
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import json
from agents.orchestrator import orchestrator
from . import crud

router = APIRouter()

@router.get("/verdicts", response_model=List[schemas.VerdictHistoryItem])
async def get_history(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """
    Get recent verification history with community votes.
    """
    return await crud.get_verdicts_with_votes(db, limit)

@router.post("/vote", response_model=schemas.CommunityVoteResponse)
async def post_vote(request: schemas.CommunityVoteRequest, db: AsyncSession = Depends(get_db)):
    """
    Submit a community vote for a verdict.
    """
    # For now, using a Mock User ID (1). In production, get from JWT/Auth.
    return await crud.create_community_vote(db, request.verdict_id, 1, request.vote)

@router.get("/stats", response_model=schemas.CommunityStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """
    Get global platform stats.
    """
    return await crud.get_global_stats(db)


@router.post("/verify/text", response_model=schemas.VerificationReport)
async def verify_text(request: schemas.ClaimExtractRequest, db: AsyncSession = Depends(get_db)):
    """
    Synchronous endpoint for analyzing text claims.
    """
    report = await orchestrator.dispatch_parallel({"text": request.text})
    
    # Map backend report to frontend schema
    return schemas.VerificationReport(
        claims_analyzed=1,
        overall_score=report["final_verdict"].get("confidence", 0.0) * 100,
        verdict=report["final_verdict"].get("status", "MIXED"),
        original_claims=[
            schemas.AtomicClaim(id="claim_1", text=request.text, confidence=0.95)
        ],
        citations=[
            schemas.Citation(
                source_name=c.get("source"),
                url=c.get("url"),
                stance=c.get("stance"),
                excerpt=c.get("excerpt"),
                trust_level=5
            ) for c in report.get("detailed_reports", {}).get("CitationFinder", {}).get("citations", [])
        ]
    )

@router.websocket("/ws/verify")
async def websocket_verify(websocket: WebSocket):
    """
    WebSocket endpoint for streaming multi-agent results in real-time.
    """
    await websocket.accept()
    
    try:
        # 1. Ingest task from WebSocket
        data = await websocket.receive_text()
        task_data = json.loads(data)
        
        # 2. Start Streaming Pipeline
        async for update in orchestrator.stream_verification(task_data):
            # 3. Yield to frontend
            await websocket.send_json(update)
            
            # Short artificial lag to ensure visual "Trace" populates gracefully
            await asyncio.sleep(0.3)
            
    except WebSocketDisconnect:
        print("Client disconnected from TruthLens WebSocket.")
    except Exception as e:
        await websocket.send_json({"status": "failed", "error": f"Internal Error: {str(e)}"})
        print(f"TruthLens WebSocket Error: {e}")
    finally:
        # 4. Graceful closure (Wait 1.0s to ensure buffer flushes to browser)
        try:
           await asyncio.sleep(1.0)
           await websocket.close()
        except:
           pass
