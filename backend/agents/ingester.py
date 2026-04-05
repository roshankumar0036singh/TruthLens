import os
import httpx
import asyncio
from typing import Dict, Any, Optional
from .base import BaseAgent

class FirecrawlIngester(BaseAgent):
    """
    Agent 0: The Ingestion Node.
    Uses Firecrawl to scrape and markdownify complex web pages.
    """
    def __init__(self):
        super().__init__("Firecrawl")
        self.api_key = os.getenv("FIRECRAWL_API_KEY")
        self.base_url = "https://api.firecrawl.dev/v1" # Using v1 for better performance

    async def scrape_url(self, url: str) -> Optional[str]:
        """Scrapes a URL and returns clean markdown."""
        if not self.api_key:
            print("Warning: FIRECRAWL_API_KEY missing.")
            return None
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "url": url,
            "formats": ["markdown"],
            "onlyMainContent": True
        }
        
        try:
            async with httpx.AsyncClient() as client:
                # 1. Start Scrape
                resp = await client.post(f"{self.base_url}/scrape", headers=headers, json=payload, timeout=15.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("success"):
                        return data.get("data", {}).get("markdown")
                return None
        except Exception as e:
            print(f"Firecrawl Scrape Error: {e}")
            return None

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Specialized 'run' for ingestion. Usually called as a pre-processor.
        """
        url = input_data.get("url")
        if not url: return {"content": ""}
        
        markdown = await self.scrape_url(url)
        return {"content": markdown}

# Instance is managed by the orchestrator initialization logic
