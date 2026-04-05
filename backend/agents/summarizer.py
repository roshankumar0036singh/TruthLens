import os
from typing import Dict, Any, List
from .base import BaseAgent

class SummarizerAgent(BaseAgent):
    """
    Agent 5: Summarizer.
    Generates a high-impact, 1-sentence "Neon Summary" for the community feed.
    """
    def __init__(self):
        super().__init__("Summarizer")
        self.model_name = "mistral-tiny" # Or a fast local model

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        text = input_data.get("text", "")
        if not text:
            return {"summary": "No content to summarize."}
            
        # 1. Summarization Prompt
        # Goal: Create a punchy, click-worthy but accurate summary for the ledger.
        prompt = f"""
        Summarize the following news content into EXACTLY one high-impact, journalistic sentence.
        Avoid opinion. Focus on the core assertion being made.
        
        Content: {text[:2000]}
        
        ONE SENTENCE SUMMARY:
        """
        
        response = await self.generate_response(prompt)
        summary = response.get("text", "Analysis complete.").strip()
        
        # Cleanup
        summary = summary.split('\n')[0]
        
        return {
            "summary": summary,
            "char_count": len(summary)
        }

    async def health_check(self) -> bool:
        return True
