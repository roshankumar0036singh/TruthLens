import asyncio, os, json, sys
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

class SentimentAnalysis(BaseModel):
    manipulation_score: float
    emotions_detected: List[str]
    logical_fallacies: List[str]
    political_bias: str
    readability_level: str
    secondary_consensus: str

async def main():
    from agents.llm_factory import LLMFactory
    f = LLMFactory()
    print(f"mistral_key exists: {bool(f.mistral_key)}", flush=True)
    print(f"gemini_client exists: {bool(f.gemini_client)}", flush=True)
    
    prompt = "Analyze this for misinformation: NASA says Moon is hollow titanium. Return JSON with: manipulation_score, emotions_detected, logical_fallacies, political_bias, readability_level, secondary_consensus"
    
    print("CALLING generate_content with schema...", flush=True)
    result = await f.generate_content(prompt, response_schema=SentimentAnalysis)
    print(f"FINAL RESULT: {result}", flush=True)

asyncio.run(main())
