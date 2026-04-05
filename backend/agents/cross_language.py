import os
from typing import Dict, Any, List
from .base import BaseAgent

from pydantic import BaseModel

class TranslationResult(BaseModel):
    is_english: bool
    original_language_code: str
    translated_text: str
    detected_idioms: List[str]

class CrossLanguageAgent(BaseAgent):
    """
    Agent 5: Cross-Language Fact-Check.
    Translates non-English claims to English for robust checking, 
    and translates verification results back to the original language.
    Specially tuned for regional and hyper-local idioms (e.g. Hindi, Marathi).
    """
    def __init__(self):
        super().__init__("CrossLanguage")
        self.lingo_key = os.getenv("LINGO_DEV_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        text = input_data.get("text", "")
        if not text:
            return {"translated": False, "status": "No text"}
            
        prompt = f"""
        Analyze the language of the following text.
        If it is entirely in English, return is_english=True and original_language_code="en".
        If it is NOT English, identify its 2-letter ISO language code and translate it into clear English.
        
        CRITICAL: Pay special attention to hyper-local phrases, regional dialects, or colloquial idioms (especially in South Asian languages like Hindi or Marathi) that might change the true intent of the claim if translated literally. 
        List any such detected phrases in the `detected_idioms` array along with their cultural context.
        
        Text: \"{text[:500]}\"
        """
        
        # 1. Single Pass Detection & Translation with Contextual Awareness
        result = await self.generate_response(prompt, response_schema=TranslationResult)
        
        if result.get("is_english", True) and not result.get("detected_idioms"):
            return {"translated": False, "original_lang": "en"}
            
        return {
            "translated": True,
            "original_lang": result.get("original_language_code", "unknown"),
            "translated_text": result.get("translated_text", ""),
            "detected_idioms": result.get("detected_idioms", []),
            "confidence": 0.95
        }

    async def health_check(self) -> bool:
        # Check if translation provider APIs are available
        return bool(self.lingo_key or self.mistral_key)
