import os
import json
from typing import Dict, Any, List
from pydantic import BaseModel
from .base import BaseAgent
from .llm_factory import llm_factory

class ReasoningNode(BaseModel):
    id: str
    label: str
    type: str # CLAIM, EVIDENCE, SOURCE, VERDICT

class ReasoningEdge(BaseModel):
    source: str
    target: str
    label: str # SUPPORTS, CONTRADICTS, ANALYZES

class FinalVerdict(BaseModel):
    verdict: str  # VERIFIED, UNVERIFIED, FALSE, MIXED
    confidence_score: float  # 0 to 100
    human_explanation: str
    key_reasons: List[str]
    reasoning_graph: Dict[str, Any] # {nodes: [], edges: []}
    requires_human_verification: bool = False


class AggregatorAgent(BaseAgent):
    """
    Synthesizes results from specialized agents into a final verdict.
    Includes a 'Heuristic Fallback' for 100% reliability even if LLMs fail.
    """
    def __init__(self):
        super().__init__("Aggregator")

    def _calculate_heuristic_verdict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule-based synthesis for cases where APIs are rate-limited.
        Calculates consensus from successful agent signals.
        """
        resolved_agents = [name for name, data in input_data.items() if "error" not in data and name != "original_query"]
        
        if not resolved_agents:
            return {
                "verdict": "UNVERIFIED",
                "confidence_score": 0.0,
                "human_explanation": "Insufficient agent signals to provide a verdict. Multi-agent ensemble is currently recovering from API quota limits.",
                "key_reasons": ["All providers rate-limited"]
            }

        # 1. Check for clear FALSE signals
        is_potentially_false = any("fake" in str(v).lower() or "false" in str(v).lower() for v in input_data.values())
        
        # 2. Check Manipulation Score
        manip_score = input_data.get("SentimentBias", {}).get("manipulation_score", 0.0)
        
        # 3. Simple Majority Logic
        if is_potentially_false or manip_score > 0.7:
            verdict = "FALSE"
        elif len(resolved_agents) >= 4:
            verdict = "VERIFIED"
        else:
            verdict = "MIXED"

        # 4. Set Human Verification Flag
        confidence = 50.0 + (len(resolved_agents) * 5)
        requires_human = 40.0 <= confidence <= 70.0

        return {
            "verdict": verdict,
            "confidence_score": confidence,
            "human_explanation": f"[HEURISTIC] Synthesized from {len(resolved_agents)} active signals. Primary LLM was unavailable, but cross-agent analysis suggests {verdict}.",
            "key_reasons": [f"{name} analysis completed successfully" for name in resolved_agents[:3]],
            "reasoning_graph": {
                "nodes": [
                    {"id": "claim_0", "label": input_data.get("original_query", {}).get("text", "Main Claim")[:30]+"...", "type": "CLAIM"},
                    {"id": "verdict_0", "label": verdict, "type": "VERDICT"}
                ],
                "edges": [
                    {"source": "claim_0", "target": "verdict_0", "label": "ANALYZED_AS"}
                ]
            },
            "requires_human_verification": requires_human
        }

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesizes agent data into a human verdict with XAI Graph.
        """
        prompt = f"""
        You are the TruthLens Aggregator, a strict Epistemic Truth Engine. Yield a final diagnostic synthesis.
        
        AGENT DATA STREAM:
        {json.dumps(input_data, indent=2)}
        
        CRITICAL 100% ACCURACY STANDARDS:
        1. STRICT REPUTATION REQUIREMENT: You MUST NOT mark VERIFIED unless multiple pieces of evidence exist AND SourceCredibility indicates the originating domain is highly trustworthy (gov/edu/reuters, Age>5).
        2. ZERO TOLERANCE MANIPULATION: If 'MediaForensics' manipulation_score > 0.65 or displays physical manipulation, the verdict must be FALSE. Textual claims cannot supersede visual forensics.
        3. FACT-CHECKER OVERRIDE: If 'CitationFinder' found Snopes, Reuters, or PolitiFact explicitly debunking this, immediately rule FALSE with high confidence.
        4. UNVERIFIED BY DEFAULT: If sources are obscure blogs, low-trust TLDs, or contradict each other heavily, output UNVERIFIED or MIXED. Do not output VERIFIED just because websites agree with each other.
        5. Provide a sharp, undeniable explanation.
        6. GENERATE A STRICT REASONING GRAPH connecting Evidence (Nodes) to the Verdict (Target Node) with strict logical descriptors (CONTRADICTS, PROVES_FALSE, CONFIRMS).
        
        Return your answer in a valid JSON object with EXACTLY these keys:
        - "verdict": string (VERIFIED, UNVERIFIED, FALSE, or MIXED)
        - "confidence_score": float (0 to 100)
        - "human_explanation": string (your direct, factual explanation)
        - "key_reasons": list of strings (bullet points summarizing exact evidence)
        - "reasoning_graph": {{ "nodes": [ {{ "id": string, "label": string, "type": string }} ], "edges": [ {{ "source": string, "target": string, "label": string }} ] }}
        """

        try:
            # 1. Primary Attempt: Mistral/Gemini Synthesis
            result = await llm_factory.generate_content(
                prompt=prompt,
                response_schema=FinalVerdict,
                temperature=0.1,
                model_preference="mistral"
            )
            
            # 2. Check for ambiguity
            if 40.0 <= result.get("confidence_score", 0) <= 70.0:
                result["requires_human_verification"] = True
                
            return result

        except Exception as e:
            # Final Manual Synthesis Fallback
            print(f"Synthesis LLM failed ({e}), switching to Heuristic Engine.")
            return self._calculate_heuristic_verdict(input_data)

    async def health_check(self) -> bool:
        return True
