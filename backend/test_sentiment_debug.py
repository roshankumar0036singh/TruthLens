"""
Isolated SentimentBias Debug Test.
Tests the EXACT same call that SentimentBias makes to find why only it fails.
"""
import asyncio
import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Reproduce the exact schema
class SentimentAnalysis(BaseModel):
    manipulation_score: float
    emotions_detected: List[str]
    logical_fallacies: List[str]
    political_bias: str
    readability_level: str
    secondary_consensus: str

async def test_isolated():
    # Import AFTER dotenv
    from agents.llm_factory import LLMFactory
    
    factory = LLMFactory()
    
    text = "NASA officially admits that the Moon is an artificial structure made of hollow titanium."
    
    prompt = f"""
    Analyze the following text for signs of misinformation tactics (emotional manipulation, logical fallacies). 
    You must also detect political bias and general tone.
    
    Text: \"\"\"{text}\"\"\"
    
    Rules:
    1. Rate manipulation from 0.0 to 1.0.
    2. Identify specific emotions (e.g., fear, urgency, outrage).
    3. List specific logical fallacies if present.
    4. Categorize political bias (Left/Center/Right/None).
    5. For 'secondary_consensus', provide a 1-sentence summary of the text's overall credibility from a neutral peer perspective.
    """
    
    print("=== TEST 1: Plain text call (like CrossLanguage does) ===")
    r1 = await factory.generate_content("Say hello", response_schema=None)
    print(f"Result: {r1}")
    print()
    
    print("=== TEST 2: Schema call WITH SentimentAnalysis (the failing call) ===")
    r2 = await factory.generate_content(prompt, response_schema=SentimentAnalysis)
    print(f"Result: {r2}")
    print()
    
    print("=== TEST 3: Schema call but model_preference='gemini' ===")
    r3 = await factory.generate_content(prompt, response_schema=SentimentAnalysis, model_preference="gemini")
    print(f"Result: {r3}")

if __name__ == "__main__":
    asyncio.run(test_isolated())
