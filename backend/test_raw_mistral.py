"""
Minimal Mistral JSON schema test - shows raw response content.
"""
import asyncio
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = os.getenv("MISTRAL_API_KEY")
    
    prompt = """
    Analyze the following text for signs of misinformation tactics.
    Text: "NASA officially admits that the Moon is an artificial structure made of hollow titanium."
    
    Rules:
    1. Rate manipulation from 0.0 to 1.0.
    2. Identify specific emotions.
    3. List specific logical fallacies if present.
    4. Categorize political bias (Left/Center/Right/None).
    5. For 'secondary_consensus', provide a 1-sentence summary.
    
    Return in valid JSON with keys: manipulation_score, emotions_detected, logical_fallacies, political_bias, readability_level, secondary_consensus
    """
    
    async with httpx.AsyncClient() as client:
        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        data = {
            "model": "mistral-large-latest",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
        
        print("Sending to Mistral...")
        try:
            response = await client.post(url, headers=headers, json=data, timeout=30.0)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                raw_content = result["choices"][0]["message"]["content"]
                print(f"RAW CONTENT TYPE: {type(raw_content)}")
                print(f"RAW CONTENT:\n---\n{raw_content}\n---")
                
                # Try parsing
                try:
                    parsed = json.loads(raw_content)
                    print(f"PARSED OK: {parsed}")
                except json.JSONDecodeError as e:
                    print(f"JSON PARSE FAILED: {e}")
                    print(f"Trying regex extraction...")
                    import re
                    match = re.search(r'\{.*\}', raw_content, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        print(f"REGEX PARSED: {parsed}")
            else:
                print(f"Error body: {response.text}")
        except Exception as e:
            print(f"Exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
