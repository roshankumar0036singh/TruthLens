import os
import json
import asyncio
from typing import Dict, Any, Optional
from urllib.parse import urlparse
import httpx
from .base import BaseAgent

# Very simple caching for demonstration
_source_cache = {}

class SourceCredibilityAgent(BaseAgent):
    def __init__(self):
        super().__init__("SourceCredibility")
        self.google_api_key = os.getenv("GOOGLE_FACT_CHECK_API_KEY")

    def _extract_domain(self, url: str) -> str:
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc
            if netloc.startswith("www."):
                netloc = netloc[4:]
            return netloc
        except Exception:
            return ""

    async def _check_google_factcheck(self, domain: str) -> Optional[int]:
        if not self.google_api_key:
            return None
            
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {"query": f"site:{domain}", "key": self.google_api_key}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    claims = data.get("claims", [])
                    return len(claims)
                return 0
            except Exception:
                return 0

    async def _check_ad_signals(self, domain: str) -> Dict[str, Any]:
        """Scans for ad-network signatures and funding transparency."""
        # In production: Fetch /ads.txt and scan for known misinformation funders
        suspicious_networks = ["mgid.com", "revcontent.com", "taboola.com"]
        
        # Mocking signal detection
        if domain in ["breitbart.com", "infowars.com"]: # Examples of high-ad density / controversial
            return {
                "funding_model": "Ad-Heavy",
                "known_networks": ["Taboola", "MGID"],
                "transparency_score": 30,
                "risk": "HIGH"
            }
        
        return {
            "funding_model": "Subscription/Institutional",
            "known_networks": ["Direct-Sales"],
            "transparency_score": 90,
            "risk": "LOW"
        }

    async def _query_whois_signals(self, domain: str) -> Dict[str, Any]:
        """Check for domain age and SSL signals (Mocked for Demo)."""
        # In production: Use 'whois' library to check domain creation date
        
        # 1. Trusted Institutional Sources
        if domain in ["who.int", "cdc.gov", "reuters.com", "apnews.com"]:
            return {"age_years": 25, "is_trusted_tld": True, "ssl": "A+", "category": "institutional"}
            
        # 2. Regional Trusted Sources (India)
        if domain in ["thehindu.com", "indianexpress.com", "hindustantimes.com", "ptinews.com"]:
            return {"age_years": 15, "is_trusted_tld": True, "ssl": "A", "category": "regional_trusted"}
            
        # 3. Verified Fact-Checkers (Local)
        if domain in ["altnews.in", "boomlive.in", "thequint.com"]:
            return {"age_years": 8, "is_trusted_tld": True, "ssl": "A", "category": "local_fact_checker"}
            
        return {"age_years": 1, "is_trusted_tld": False, "ssl": "B", "category": "unknown"}

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        url = input_data.get("url")
        if not url: return {"score": 50.0}
        
        domain = self._extract_domain(url)
        if not domain: return {"score": 50.0}

        # 1. Dispatch multi-signal sources in parallel
        whois_task = self._query_whois_signals(domain)
        factcheck_task = self._check_google_factcheck(domain)
        ad_signals_task = self._check_ad_signals(domain)
        
        whois_data, fc_count, ad_signals = await asyncio.gather(whois_task, factcheck_task, ad_signals_task)
        
        # 2. Score Calculation Logic
        score = 60.0 # start baseline
        reasons = []
        
        # Source A: Fact Check History
        if fc_count > 10:
            score -= 30
            reasons.append("Frequently identified as a source of misinformation.")
        elif fc_count == 0:
            score += 10
            reasons.append("Clean record in major fact-check archives.")
            
        # Source B: WHOIS / Age
        if whois_data.get("age_years", 0) < 2:
            score -= 15
            reasons.append("Recently registered domain (potential burner site).")
        else:
            score += 10
            reasons.append(f"Domain established for {whois_data['age_years']} years.")

        # Source C: Trusted TLDs
        if domain.endswith((".gov", ".edu", ".int")):
            score += 20
            reasons.append("Official institutional domain extension.")

        # Source D: Ad-Network / Financials
        if ad_signals.get("risk") == "HIGH":
            score -= 10
            reasons.append(f"Ad-heavy model with exposure to {', '.join(ad_signals.get('known_networks', []))}.")

        return {
            "domain": domain,
            "overall_credibility_score": max(0.0, min(100.0, score)),
            "evidence_signals": reasons,
            "financial_intel": ad_signals,
            "metadata": whois_data
        }

    async def health_check(self) -> bool:
        return True
