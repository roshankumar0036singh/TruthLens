import os
import json
import asyncio
import httpx
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from .base import BaseAgent

class StanceResult(BaseModel):
    source_index: int
    stance: str = Field(pattern="^(APPROVE|DISAPPROVE|NEUTRAL)$")
    reasoning: str
    excerpt: str

class BatchEvaluation(BaseModel):
    evaluations: List[StanceResult]

class CitationFinderAgent(BaseAgent):
    """
    Agent 3 Upgrade: Citation Parallel Ensemble.
    Queries 4 sources simultaneously and merges results for high coverage.
    """
    def __init__(self):
        super().__init__("CitationFinder")
        self.google_key = os.getenv("GOOGLE_CUSTOM_SEARCH_API_KEY")
        self.google_cx = os.getenv("GOOGLE_CUSTOM_SEARCH_CX")
        self.firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
        self.serpapi_key = os.getenv("SERPAPI_API_KEY") 
        self.scholar_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        
        # Diagnostic: SerpAPI is now primary search provider
        if self.serpapi_key:
            masked = f"{self.serpapi_key[:8]}...{self.serpapi_key[-4:]}"
            print(f"[CitationFinder] SerpAPI Key Loaded ({masked}) - PRIMARY search active.")
        else:
            print("[CitationFinder] WARNING: SerpAPI key missing. Add SERPAPI_API_KEY to .env")
        if self.firecrawl_key:
            print("[CitationFinder] Firecrawl Key Loaded - SECONDARY search active.")

    async def _query_google(self, query: str) -> List[Dict]:
        if not self.google_key or not self.google_cx: return []
        url = "https://www.googleapis.com/customsearch/v1"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params={"key": self.google_key, "cx": self.google_cx, "q": query, "num": 4}, timeout=8.0)
                if resp.status_code == 200:
                    return [{"url": i.get("link"), "title": i.get("title"), "snippet": i.get("snippet"), "source": "Google"} for i in resp.json().get("items", [])]
                else:
                    print(f"Google API Error: {resp.status_code} - {resp.text[:100]}")
        except Exception as e:
            print(f"Google Search Exception: {e}")
        return []

    async def _query_serpapi(self, query: str) -> List[Dict]:
        """Robust fallback for Google Search via SerpAPI."""
        if not self.serpapi_key: return []
        url = "https://serpapi.com/search"
        params = {
            "engine": "google",
            "q": query,
            "api_key": self.serpapi_key,
            "num": 3
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, timeout=10.0)
                if resp.status_code == 200:
                    results = resp.json().get("organic_results", [])
                    return [{"url": r.get("link"), "title": r.get("title"), "snippet": r.get("snippet"), "source": "SerpAPI"} for r in results]
        except Exception as e:
            print(f"SerpAPI Error: {e}")
        return []

    async def _query_duckduckgo(self, query: str) -> List[Dict]:
        return [] # Placeholder

    async def _query_firecrawl(self, query: str) -> List[Dict]:
        if not self.firecrawl_key: return []
        url = "https://api.firecrawl.dev/v0/search"
        headers = {"Authorization": f"Bearer {self.firecrawl_key}", "Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, headers=headers, json={"query": query, "limit": 2}, timeout=15.0)
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    return [{"url": d.get("url"), "content": d.get("markdown"), "source": "Firecrawl"} for d in data]
        except Exception as e:
            print(f"Firecrawl Error: {e}")
        return []

    async def _query_scholarly(self, query: str) -> List[Dict]:
        if not self.scholar_key: return []
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        headers = {"x-api-key": self.scholar_key}
        params = {"query": query, "limit": 2, "fields": "title,url,abstract"}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=headers, params=params, timeout=10.0)
                if resp.status_code == 200:
                    papers = resp.json().get("data", [])
                    return [{"url": p.get("url"), "source": "Scholar", "title": p.get("title"), "snippet": p.get("abstract", "")[:300]} for p in papers]
        except Exception: return []
        return []

    def _clean_query(self, text: str) -> str:
        """URL Guard and Truncation for better search matching."""
        if not text: return ""
        # 1. URL Guard
        if text.startswith("http"): return ""
        # 2. Truncate to first 12 words to maximize search relevance
        words = text.split()
        return " ".join(words[:12])

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        claims = input_data.get("extracted_claims", [])
        if not claims:
            text = input_data.get("text", "")
            if not text or text.startswith("http"): return {"citation_report": []}
            claims = [{"claim": text}]

        final_report = []
        for claim_obj in claims:
            claim_text = claim_obj.get("claim", "")
            search_query = self._clean_query(claim_text)
            if not search_query: continue
            
            # 1. Multi-Query Dispatch (SerpAPI primary, Firecrawl + Scholar as secondary)
            # Google Custom Search removed - use SerpAPI which works without billing restrictions
            search_tasks = [
                self._query_serpapi(f"fact check {search_query}"),
                self._query_serpapi(search_query),
                self._query_firecrawl(search_query),
                self._query_scholarly(search_query)
            ]
            
            raw_results = await asyncio.gather(*search_tasks)
            merged_citations = [item for sublist in raw_results for item in sublist if item]
            
            # Unique citations only
            seen_urls = set()
            unique_citations = []
            for c in merged_citations:
                u = c.get("url")
                if u and u not in seen_urls:
                    unique_citations.append(c)
                    seen_urls.add(u)

            # 2. Batched LLM Evaluation
            eval_results = []
            # High-recall filter (just check if there is some text)
            top_citations = [c for c in unique_citations if len(c.get("snippet", c.get("content", ""))) > 15][:6]
            
            if not top_citations:
                print(f"CitationFinder: Total search failure for '{search_query[:30]}...'")
            
            if top_citations:
                sources_text = ""
                for idx, cit in enumerate(top_citations):
                    snippet = cit.get("snippet", cit.get("content", ""))[:800]
                    sources_text += f"Source {idx} ({cit.get('source')}):\n{snippet}\n\n"
                    
                prompt = f"""
                Claim: "{claim_text}"
                
                Evaluate the following sources numbered 0 to {len(top_citations)-1}. 
                Return the source_index, stance (APPROVE, DISAPPROVE, or NEUTRAL), reasoning, and key excerpt for each.
                IMPORTANT: If a source is irrelevant or provides no data, mark it NEUTRAL with 'Insufficient Evidence' reasoning.
                
                Sources:
                {sources_text}
                """
                
                try:
                    analysis = await self.generate_response(prompt, response_schema=BatchEvaluation)
                    
                    if isinstance(analysis, dict):
                        evaluations = analysis.get("evaluations", [])
                    elif isinstance(analysis, list):
                        evaluations = analysis
                    else:
                        evaluations = []
                    
                    for eval_item in evaluations:
                        idx = eval_item.get("source_index", -1)
                        if 0 <= idx < len(top_citations):
                            eval_results.append({
                                "url": top_citations[idx].get("url"),
                                "source": top_citations[idx].get("source"),
                                "stance": eval_item.get("stance"),
                                "reasoning": eval_item.get("reasoning"),
                                "excerpt": eval_item.get("excerpt", "N/A")
                            })
                except Exception as e:
                    print(f"Citation batch evaluation failed: {e}")

            final_report.append({
                "claim": claim_text,
                "evidence": eval_results
            })

        return {"citation_report": final_report}
