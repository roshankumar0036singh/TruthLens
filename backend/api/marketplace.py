from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price_shm: float
    requests_per_month: int
    features: List[str]

# 1. Available Plans
PLANS = [
    SubscriptionPlan(
        id="free",
        name="Truth-Seeker",
        price_shm=0.0,
        requests_per_month=100,
        features=["Basic Verification", "No Priority"]
    ),
    SubscriptionPlan(
        id="pro",
        name="Guardian",
        price_shm=50.0,
        requests_per_month=10000,
        features=["Vision AI", "Priority Dispatch", "Bot Detection"]
    ),
    SubscriptionPlan(
        id="enterprise",
        name="Oracle",
        price_shm=250.0,
        requests_per_month=100000,
        features=["Custom API Integration", "White-label reports"]
    )
]

@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_plans():
    return PLANS

@router.post("/subscribe")
async def subscribe(plan_id: str, wallet_address: str):
    """
    Subscribes a wallet to a plan. In production, this would trigger 
    a SHM payment on Shardeum before activating the plan.
    """
    plan = next((p for p in PLANS if p.id == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    return {
        "status": "success",
        "message": f"Successfully subscribed to {plan.name}",
        "wallet": wallet_address,
        "transaction_id": "0x-mock-shm-payment-id"
    }

@router.get("/usage")
async def get_usage(api_key: str):
    """
    Shows current API consumption.
    """
    return {
        "api_key": api_key,
        "requests_total": 45,
        "remaining": 55,
        "period_end": "2026-05-01"
    }
