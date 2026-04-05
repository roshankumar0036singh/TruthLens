import asyncio
import random
import httpx
import re
from typing import List, Dict, Any
from agents.orchestrator import orchestrator
from agents.viral_tracker import ViralTrackerAgent
from .blockchain import blockchain_service
from .quest_service import quest_service

class SentinelService:
    """
    Background worker that monitors trending misinformation and 
    automatically anchors verifications on-chain.
    """
    def __init__(self):
        self.is_running = False
        self.viral_agent = ViralTrackerAgent()
        self.interval_seconds = 3600 # Poll every 1 hour as requested
        self.alert_callbacks = []
        self.historical_claims = set() # Avoid processing the same claim twice

    def subscribe_to_alerts(self, callback):
        """Register a callback for critical alerts."""
        self.alert_callbacks.append(callback)

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        print("TruthLens Sentinel Service: Operational (Real-Time Pool Discovery).")
        asyncio.create_task(self._monitor_loop())

    async def _monitor_loop(self):
        while self.is_running:
            try:
                print("Sentinel: Scanning global social signals (Pool Mode)...")
                # 1. Fetch "Trending" claims from Real RSS Feeds
                pool = await self._fetch_trending_claims()
                
                # 2. Rerank and select TOP 3 latest/unique claims
                top_claims = [c for c in pool if c not in self.historical_claims][:3]
                
                if not top_claims:
                    print("Sentinel: No new high-impact claims detected in this cycle.")
                
                for claim in top_claims:
                    self.historical_claims.add(claim)
                    print(f"Sentinel: Investigating top-3 trending claim: '{claim[:60]}...'")
                    
                    # 3. Verify with Multi-Agent Ensemble
                    result = await orchestrator.dispatch_parallel({"text": claim})
                    
                    verdict = result.get("final_verdict", {})
                    confidence = verdict.get("confidence_score", 0.0)
                    status = verdict.get("verdict", "UNVERIFIED")

                    # 4. Decision Logic: If clear FALSE and high confidence
                    if status == "FALSE" and confidence > 90.0:
                        print(f"Sentinel: CRITICAL MISINFORMATION DETECTED ({confidence}%). Anchoring to Shardeum...")
                        
                        # A. Anchor to blockchain
                        tx_hash = await blockchain_service.anchor_content(
                            article_id_hex=f"0x{random.getrandbits(256):064x}",
                            content_hash=claim
                        )
                        
                        alert_data = {
                            "claim": claim,
                            "verdict": status,
                            "confidence": confidence,
                            "tx_hash": tx_hash,
                            "insight": verdict.get("human_explanation", "Viral news sweep.")
                        }
                        for cb in self.alert_callbacks:
                            asyncio.create_task(cb(alert_data))
                    else:
                        print(f"Sentinel: Claim analyzed. Status: {status} ({confidence}%). No action taken.")

            except Exception as e:
                print(f"Sentinel Loop Error: {e}")
            
            # Sleep for 1 hour
            await asyncio.sleep(self.interval_seconds)

    async def _fetch_trending_claims(self) -> List[str]:
        """
        Extracts feeds from multiple news sources and compiles a candidate pool.
        """
        candidate_pool = []
        rss_feeds = [
            "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
            "http://feeds.bbci.co.uk/news/world/rss.xml"
        ]
        
        async with httpx.AsyncClient() as client:
            for url in rss_feeds:
                try:
                    resp = await client.get(url, timeout=10.0)
                    if resp.status_code == 200:
                        # Extract titles from RSS XML using regex (minimizes dependencies)
                        titles = re.findall(r'<title>(.*?)</title>', resp.text)
                        # Skip the first title (usually the channel title)
                        candidate_pool.extend([t.strip() for t in titles[1:15] if len(t.strip()) > 30])
                except Exception as e:
                    print(f"Sentinel: Failed to fetch {url}: {e}")
                    
        # Add high-velocity simulation items if pool is empty
        if not candidate_pool:
            candidate_pool = [
                "New scientific report warns of imminent sea level rise in Pacific islands.",
                "Unverified claims circulate regarding a major central bank digital currency launch.",
                "Tech giants announce breakthrough in nuclear fusion energy research."
            ]
        
        return list(dict.fromkeys(candidate_pool)) # Unique items only

sentinel_service = SentinelService()
