from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from agents.llm_factory import llm_factory
from agents.citation_finder import CitationFinderAgent

router = APIRouter()
citation_agent = CitationFinderAgent()

class HeadlessCheckRequest(BaseModel):
    text: str
    url: Optional[str] = None

class HeadlessCheckResponse(BaseModel):
    verdict: str # "VERIFIED", "FALSE", "UNKNOWN"
    confidence: float
    short_reason: str

@router.post("/check", response_model=HeadlessCheckResponse)
async def quick_check(request: HeadlessCheckRequest):
    """
    Rapid, single-agent verification for on-page highlighting.
    Optimized to reduce 'UNKNOWN' results for credible breaking news.
    """
    if not request.text or len(request.text.strip()) < 40:
        return HeadlessCheckResponse(verdict="UNKNOWN", confidence=0.0, short_reason="Insufficient context.")

    # Trusted hosts list for heuristic stabilization
    TRUSTED_HOSTS = ["aljazeera.com", "reuters.com", "apnews.com", "bbc.com", "nytimes.com", "theguardian.com", "bloomberg.com"]
    is_trusted = any(h in (request.url or "").lower() for h in TRUSTED_HOSTS)

    # 1. Quick Extraction
    extract_prompt = f"Summarize the core factual claim in 1 sentence: \"{request.text[:400]}\". Return ONLY the claim."
    try:
        extract_result = await llm_factory.generate_content(extract_prompt, model_preference="mistral")
        claim = extract_result.get("text", request.text).strip()
        
        # 2. Multi-Query Search (Corroboration + Fact Check)
        search_tasks = [
            citation_agent._query_google(f"fact check {claim}"), # Looking for debunkings
            citation_agent._query_google(f"{claim}")            # Looking for corroborating news
        ]
        results = await asyncio.gather(*search_tasks)
        merged = [item for sublist in results for item in sublist]
        sources_text = "\n".join([f"- {s['title']} ({s['source']}): {s['snippet']}" for s in merged[:4]])
        
        # 3. Nuanced Verdict Logic
        verdict_prompt = f"""
        Claim: \"{claim}\"
        Source Context: {request.url if request.url else "Unknown Website"}
        Credibility: {"HIGH (Trusted Publisher)" if is_trusted else "Standard"}
        
        Search Evidence:
        {sources_text if sources_text else "No external search results found."}
        
        Verdict Guidelines:
        - If multiple news sources confirm it, mark VERIFIED.
        - If search results debunk it, mark FALSE.
        - If no search results but the Context is HIGH Credibility, mark VERIFIED (ORIGIN_TRUST).
        - Otherwise, mark UNKNOWN.

        Return a JSON object: {{"verdict": "VERIFIED"|"FALSE"|"UNKNOWN", "confidence": 0.0-1.0, "reason": "short sentence"}}
        """
        
        class QuickVerdictSchema(BaseModel):
            verdict: str
            confidence: float
            reason: str
 
        verdict_data = await llm_factory.generate_content(
            verdict_prompt, 
            response_schema=QuickVerdictSchema, 
            model_preference="mistral"
        )
        
        return HeadlessCheckResponse(
            verdict=verdict_data.get("verdict", "UNKNOWN"),
            confidence=verdict_data.get("confidence", 0.5),
            short_reason=verdict_data.get("reason", "Inconclusive results.")
        )
        
    except Exception as e:
        print(f"Headless Check Error: {e}")
        return HeadlessCheckResponse(verdict="UNKNOWN", confidence=0.0, short_reason="System overload.")
