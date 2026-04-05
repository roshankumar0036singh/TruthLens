from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
import schemas
import models
from database import get_db
from services.blockchain import blockchain_service

router = APIRouter()

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws-feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/share", response_model=schemas.CommunityShareResponse)
async def share_news(request: schemas.CommunityShareRequest, 
                     background_tasks: BackgroundTasks,
                     db: AsyncSession = Depends(get_db)):
    """
    Share a news article with a True/Fake assertion.
    anchoring on-chain happens in the background to prevent UI lag.
    """
    # 1. Save to SQL
    new_share = models.SharedNews(
        user_id=1, # Mock User
        url=request.url,
        text=request.text,
        user_assertion=request.assertion
    )
    db.add(new_share)
    await db.commit()
    await db.refresh(new_share)

    # 2. Define background anchoring task
    async def anchor_and_broadcast():
        tx_hash = await blockchain_service.anchor_share(request.url, request.assertion)
        if tx_hash:
            # We need a fresh session for the background task
            from database import async_session_factory
            async with async_session_factory() as bg_db:
                # Update the specific record
                await bg_db.execute(
                    models.SharedNews.__table__.update()
                    .where(models.SharedNews.id == new_share.id)
                    .values(transaction_hash=tx_hash)
                )
                await bg_db.commit()

        # 3. Broadcast to WebSockets
        await manager.broadcast({
            "type": "NEW_SHARE",
            "item": {
                "id": new_share.id,
                "url": new_share.url,
                "text": request.text,
                "assertion": request.assertion,
                "tx_hash": tx_hash,
                "timestamp": new_share.created_at.isoformat()
            }
        })

    background_tasks.add_task(anchor_and_broadcast)

    return {
        "id": new_share.id,
        "url": new_share.url,
        "assertion": new_share.user_assertion,
        "transaction_hash": "pending",
        "status": "pending"
    }

@router.get("/feed", response_model=List[schemas.CommunityFeedItem])
async def get_community_feed(db: AsyncSession = Depends(get_db)):
    """
    Get the global feed of community-shared news.
    """
    query = (
        select(models.SharedNews)
        .order_by(desc(models.SharedNews.created_at))
        .limit(50)
    )
    result = await db.execute(query)
    shares = result.scalars().all()

    return [
        {
            "id": s.id,
            "url": s.url,
            "text": s.text or "Analyzing Source...",
            "assertion": s.user_assertion,
            "tx_hash": s.transaction_hash,
            "timestamp": s.created_at.isoformat(),
            "upvotes": 0, # Future aggregate logic
            "downvotes": 0
        } for s in shares
    ]

@router.get("/check-url", response_model=schemas.URLCheckResponse)
async def check_url(url: str, db: AsyncSession = Depends(get_db)):
    """
    Checks if a URL has been shared or verified before.
    Used by the extension icon auto-pilot.
    """
    query = (
        select(models.SharedNews)
        .where(models.SharedNews.url == url)
        .order_by(desc(models.SharedNews.created_at))
    )
    result = await db.execute(query)
    share = result.scalars().first()
    
    if share:
        return {
            "status": "VERIFIED" if share.user_assertion == "TRUE" else "FAKE",
            "assertion": share.user_assertion,
            "id": share.id
        }
    
    return {"status": None, "assertion": None, "id": None}
