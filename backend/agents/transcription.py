import os
from typing import Dict, Any, List
from .base import BaseAgent
from .llm_factory import llm_factory

class TranscriptionAgent(BaseAgent):
    """
    Agent 8: Live Audio Transcription.
    Processes audio chunks to extract text segments that require fact-checking.
    """
    def __init__(self):
        super().__init__("Transcription")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        audio_data = input_data.get("audio_bytes") # Base64 or bytes
        if not audio_data:
            return {"text": "", "is_fact_worthy": False}

        prompt = """
        Transcribe the provided audio chunk. 
        Additionally, identify any specific factual claims made in the audio.
        
        Return JSON with keys: 
        - "transcription": string
        - "claims": [ "claim 1", "claim 2" ]
        - "is_fact_worthy": bool (true if claims are found)
        """

        # Prepare audio for Gemini
        audio_part = {"mime_type": "audio/wav", "data": audio_data}
        
        result = await llm_factory.generate_content(
            prompt=prompt,
            audio=[audio_part],
            response_schema={
                "type": "object",
                "properties": {
                    "transcription": {"type": "string"},
                    "claims": {"type": "array", "items": {"type": "string"}},
                    "is_fact_worthy": {"type": "boolean"}
                },
                "required": ["transcription", "claims", "is_fact_worthy"]
            }
        )

        return result

    async def health_check(self) -> bool:
        return True
