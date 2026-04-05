from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Literal

class ClaimExtractRequest(BaseModel):
    text: str = Field(..., description="The full text to extract claims from")

class CheckUrlRequest(BaseModel):
    url: HttpUrl = Field(..., description="The URL of the article or post to verify")

class AtomicClaim(BaseModel):
    id: str
    text: str
    confidence: float

class Citation(BaseModel):
    source_name: str
    url: HttpUrl
    stance: Literal["APPROVE", "DISAPPROVE", "NEUTRAL"]
    excerpt: str
    trust_level: int = Field(ge=1, le=5)

class VerificationReport(BaseModel):
    claims_analyzed: int
    overall_score: float = Field(ge=0, le=100)
    verdict: Literal["VERIFIED", "UNVERIFIED", "FALSE", "MIXED"]
    original_claims: List[AtomicClaim]
    citations: List[Citation]
    bias_score: Optional[float] = None
    media_manipulation_detected: bool = False

class CommunityVoteRequest(BaseModel):
    verdict_id: int
    vote: Literal[1, -1] # 1 for agree, -1 for disagree

class CommunityVoteResponse(BaseModel):
    verdict_id: int
    upvotes: int
    downvotes: int
    user_vote: Optional[int] = None

class CommunityStats(BaseModel):
    total_claims_verified: int
    average_confidence: float
    top_misleading_domain: Optional[str] = None
    active_voters_count: int
    registry_nodes: int
    consensus_ratio: float

class UserReputation(BaseModel):
    username: str
    reputation_score: int
    rank: str # e.g. "Fact-Checker", "Truth-Seeker"

class VerdictHistoryItem(BaseModel):
    id: int
    text: str
    verdict: str
    confidence: float
    timestamp: str
    upvotes: int
    downvotes: int

class CommunityShareRequest(BaseModel):
    url: str
    text: Optional[str] = None
    assertion: str # TRUE, FAKE

class CommunityShareResponse(BaseModel):
    id: int
    url: str
    assertion: str
    transaction_hash: Optional[str] = None
    status: str

class CommunityFeedItem(BaseModel):
    id: int
    url: str
    text: str
    assertion: str
    tx_hash: Optional[str] = None
    timestamp: str
    upvotes: int = 0
    downvotes: int = 0

class URLCheckResponse(BaseModel):
    status: Optional[str] = None
    assertion: Optional[str] = None
    id: Optional[int] = None

