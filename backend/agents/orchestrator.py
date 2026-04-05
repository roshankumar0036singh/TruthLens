import asyncio
import re
from typing import Dict, Any, List, AsyncGenerator
from .base import BaseAgent
from .aggregator import AggregatorAgent
from services.quest_service import quest_service

class OrchestratorAgent:
    """
    Dispatches tasks to agents in Waves (Batches) to prevent API rate-limits
    and 503 Overloads. Yields results in real-time.
    """
    def __init__(self):
        self.registry: Dict[str, BaseAgent] = {}
        self.aggregator = AggregatorAgent()
    
    def register_agent(self, agent: BaseAgent):
        self.registry[agent.name] = agent

    def _is_url(self, text: str) -> bool:
        url_pattern = re.compile(
            r'^(?:http|ftp)s?://'
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'
            r'localhost|'
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
            r'(?::\d+)?'
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return re.match(url_pattern, text) is not None

    async def _run_agent_with_name(self, name: str, input_data: Dict[str, Any]):
        """Helper to run a single agent with isolated error mapping."""
        try:
            result = await self.registry[name].run(input_data)
            return name, result
        except Exception as e:
            return name, {"error": str(e)}

    async def stream_verification(self, task_input: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Runs agents in manageable waves (batches of 3) to protect API health.
        """
        final_results = {}
        # 1. Preprocessing Stage (Firecrawl)
        input_text = task_input.get("text", "")
        origin_url = task_input.get("url", "")
        
        if not origin_url and self._is_url(input_text):
            origin_url = input_text
        
        if origin_url and "Firecrawl" in self.registry:
            yield {"status": "processing", "agent": "Firecrawl", "message": f"Analyzing source URL: {origin_url}..."}
            try:
                scrape_result = await self.registry["Firecrawl"].run({"url": origin_url})
                if scrape_result.get("content"):
                    task_input["text"] = scrape_result["content"]
                    yield {"status": "resolved", "agent": "Firecrawl", "message": "Content extracted from source."}
                else:
                    yield {"status": "resolved", "agent": "Firecrawl", "message": "No specific content extracted. Using raw input."}
            except Exception as e:
                yield {"status": "failed", "agent": "Firecrawl", "message": f"Scrape error: {str(e)}"}
        elif origin_url:
            yield {"status": "resolved", "agent": "Firecrawl", "message": "Firecrawl skipped (URL provided but agent disabled)."}

        # 3. WAVE 1: FACT EXTRACTION (Agent 1)
        # This MUST finish before Search agents, so we have specific claims to verify.
        if "FactExtractor" in self.registry:
            yield {"status": "processing", "agent": "FactExtractor", "message": "Deconstructing article into atomic factual claims..."}
            try:
                extract_result = await self.registry["FactExtractor"].run(task_input)
                task_input["extracted_claims"] = extract_result.get("extracted_claims", [])
                final_results["FactExtractor"] = extract_result
                yield {"status": "resolved", "agent": "FactExtractor", "message": f"Identified {len(task_input['extracted_claims'])} claims to verify."}
            except Exception as e:
                yield {"status": "failed", "agent": "FactExtractor", "message": f"Extraction error: {str(e)}"}

        # 4. WAVE 2: ENSEMBLE ANALYSIS (Parallel Search & Forensics)
        agent_names = [n for n in self.registry.keys() if n not in ["Firecrawl", "CrossLanguage", "FactExtractor"]]
        batch_size = 4
        yield {"status": "processing", "agent": "Orchestrator", "message": f"Dispatching Swarm Analysis (Wave 2)..."}

        for i in range(0, len(agent_names), batch_size):
            batch = agent_names[i:i+batch_size]
            tasks = [self._run_agent_with_name(name, task_input) for name in batch]
            
            for future in asyncio.as_completed(tasks):
                name, result = await future
                final_results[name] = result
                task_input[name] = result # Shared context
                
                status_type = "failed" if "error" in result else "resolved"
                yield {
                    "status": status_type,
                    "agent": name,
                    "message": f"{name} analysis completed." if status_type == "resolved" else f"{name} failed: {result['error']}"
                }
        
        yield {"status": "resolved", "agent": "Orchestrator", "message": "Swarm verification cycle complete."}

        # 5. Final Aggregation
        yield {"status": "processing", "agent": "Aggregator", "message": "Synthesizing truth consensus..."}
        
        try:
            synthesis_input = {**final_results, "original_query": task_input, "url": origin_url}
            verdict = await self.aggregator.run(synthesis_input)
            yield {"status": "resolved", "agent": "Aggregator", "message": "Consensus reached."}
        except Exception as e:
            yield {"status": "failed", "agent": "Aggregator", "message": f"Synthesis Error: {str(e)}"}
            verdict = {"status": "ERROR", "human_explanation": f"Failed to synthesize: {str(e)}"}
        
        # 4. Trigger Human Verification Quest if needed
        if verdict.get("requires_human_verification"):
            yield {"status": "processing", "agent": "QuestService", "message": "Ambiguity detected. Posting bounty on Shardeum..."}
            try:
                tx_hash = await quest_service.create_verification_quest(
                    claim_text=task_input.get("text", "Main Claim"),
                    context=verdict.get("human_explanation", "AI verification uncertain.")
                )
                if tx_hash:
                    yield {"status": "resolved", "agent": "QuestService", "message": f"Quest created on-chain: {tx_hash}"}
                    verdict["quest_tx_hash"] = tx_hash
            except Exception as e:
                yield {"status": "failed", "agent": "QuestService", "message": f"Quest creation error: {str(e)}"}

        yield {
            "status": "completed",
            "agent": "FinalVerdict",
            "verdict": verdict,
            "detailed_reports": final_results,
            "full_text": task_input.get("text")
        }
        await asyncio.sleep(0.5) # Buffer for client to receive final payload

    async def dispatch_parallel(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronous wrapper."""
        final_results = {}
        async for update in self.stream_verification(task_input):
            if update["status"] == "completed":
                return {
                    "detailed_reports": update["detailed_reports"],
                    "final_verdict": update["verdict"]
                }
        return {"error": "Pipeline failed to complete."}

# Global orchestrator instance
orchestrator = OrchestratorAgent()
