import os
import json
from typing import Dict, Any, List
from google import genai
from pydantic import BaseModel
from .base import BaseAgent

class AtomicClaimModel(BaseModel):
    claim: str
    entities: List[str]
    category: str
    confidence: float

class ExtractionResponse(BaseModel):
    claims: List[AtomicClaimModel]

class ClaimExtractorAgent(BaseAgent):
    def __init__(self):
        super().__init__("ClaimExtractor")
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY not set. ClaimExtractor will fail.")
        self.client = genai.Client(api_key=api_key)

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        text = input_data.get("text", "")
        # If it's a pure media scan from Discord/Sentinel, handle without blocking
        media_urls = input_data.get("media_urls", [])
        
        if not text and not media_urls:
            return {"claims": []}
            
        # Case: Text is just a placeholder for a media scan
        if "Media Analysis Request" in text or "User Media Scan" in text:
            return {
                "extracted_claims": [{
                    "claim": "The provided media contains digital manipulation or AI-generated content.",
                    "entities": ["Media Content"],
                    "category": "FORENSICS",
                    "confidence": 1.0
                }]
            }
            
        prompt = f"""
        Analyze the following text and extract the single CORE FACTUAL CLAIM that requires verification.
        Do NOT break it down into minor sub-facts. Focus on the high-impact proposition.
        Text: \"\"\"{text}\"\"\"
        """
        
        try:
            # 1. Primary Extraction (Now strictly using Mistral via llm_factory)
            result = await self.generate_response(prompt, response_schema=ExtractionResponse)
            extracted_claims = result.get("claims", [])
                
            return {"extracted_claims": extracted_claims}
            
        except Exception as e:
            raise RuntimeError(f"ClaimExtractor Error: {str(e)}")

    async def health_check(self) -> bool:
        return bool(os.getenv("GEMINI_API_KEY"))
