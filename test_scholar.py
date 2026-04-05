import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv('backend/.env')

async def test_scholar_api():
    key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
    if not key:
        print("Error: SEMANTIC_SCHOLAR_API_KEY not found in .env")
        return
        
    print(f"Testing Semantic Scholar API with Key: {key[:5]}...{key[-5:]}")
    
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    headers = {"x-api-key": key}
    params = {
        "query": "mRNA vaccine lipid nanoparticles",
        "limit": 2,
        "fields": "title,url,year"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, params=params, timeout=10.0)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Papers Found: {len(data.get('data', []))}")
                for paper in data.get('data', []):
                    print(f"- {paper.get('title')} ({paper.get('year')})")
                    print(f"  URL: {paper.get('url')}")
                print("\nSUCCESS: Semantic Scholar setup is functional.")
            else:
                print(f"FAILURE: API returned {resp.status_code}")
                print(resp.text)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_scholar_api())
