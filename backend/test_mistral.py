import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_mistral():
    key = os.getenv("MISTRAL_API_KEY")
    print(f"Testing Mistral Key: {key[:4]}...{key[-4:] if key else 'None'}")
    
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": "Analyze this claim for bias: NASA officially admits that the Moon is an artificial structure made of hollow titanium."}],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print("Sending request to Mistral...")
            response = await client.post(url, headers=headers, json=data, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request Exception Type: {type(e)}")
        print(f"Request Exception Message: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_mistral())
