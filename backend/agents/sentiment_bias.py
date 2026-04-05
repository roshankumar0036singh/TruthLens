import json
from typing import Dict, Any, List
from pydantic import BaseModel
from .base import BaseAgent
from .llm_factory import llm_factory

class SentimentAnalysis(BaseModel):
    manipulation_score: float # 0 to 1 scale (1 is highly manipulative)
    emotions_detected: List[str] # e.g. fear, anger, urgency
    logical_fallacies: List[str]
    political_bias: str # Left, Center, Right, None, Multi
    readability_level: str
    secondary_consensus: str # Peer-check feedback merged into one call

class SentimentBiasAgent(BaseAgent):
    """
    Agent 7: Analyzes the text for emotional manipulation, logical fallacies,
    and inherent biases which are strong indicators of misinformation.
    Uses Mistral exclusively to avoid Gemini quota contention with other agents.
    """
    def __init__(self):
        super().__init__("SentimentBias")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        text = input_data.get("text", "")
        if not text:
            return {"manipulation_score": 0.0, "secondary_consensus": "No text provided."}

        prompt = f"""Analyze this text for misinformation tactics. Return JSON with these exact keys:
- manipulation_score: float 0.0-1.0 (how manipulative)
- emotions_detected: list of emotions (e.g. ["fear", "urgency"])
- logical_fallacies: list of fallacies found (e.g. ["False Authority"])
- political_bias: one of Left/Center/Right/None
- readability_level: one of Simple/Moderate/Complex
- secondary_consensus: one sentence about the claim's overall credibility

Text: \"\"\"{text[:1000]}\"\"\"
"""
        try:
            # Always use Mistral to avoid competing with other agents for Gemini quota
            result = await llm_factory.generate_content(
                prompt=prompt,
                response_schema=SentimentAnalysis,
                temperature=0.1,
                model_preference="mistral"
            )
            if "error" in result:
                return {
                    "manipulation_score": 0.5,
                    "emotions_detected": [],
                    "logical_fallacies": [],
                    "political_bias": "None",
                    "readability_level": "Moderate",
                    "secondary_consensus": "Analysis unavailable (provider overloaded)."
                }
            return result
        except Exception as e:
            return {
                "error": str(e),
                "manipulation_score": 0.5,
                "secondary_consensus": "Error during analysis."
            }

    async def health_check(self) -> bool:
        return True
