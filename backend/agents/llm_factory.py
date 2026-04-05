import os
import json
import re
import asyncio
from typing import Optional, Any, Dict, List
from google import genai
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure keys are loaded before the global instance is instantiated
load_dotenv()

class LLMFactory:
    """
    A unified interface for dispatching requests to multiple LLM providers.
    Mistral is the primary provider to support high-parallelism.
    Gemini is the secondary fallback for failover.
    """
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")
        
        if self.gemini_key and self.gemini_key.strip():
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_key.strip())
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")
                self.gemini_client = None
        else:
            self.gemini_client = None

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """
        Robustly extracts JSON from LLM responses that may contain
        markdown code fences, extra whitespace, or preamble text.
        """
        # 1. Try direct parse first (fastest path)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # 2. Strip markdown code fences: ```json ... ``` or ``` ... ```
        fenced = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
        if fenced:
            try:
                return json.loads(fenced.group(1).strip())
            except json.JSONDecodeError:
                pass
        
        # 3. Find first { ... } block in the text
        brace_match = re.search(r'\{.*\}', text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass
        
        # 4. Nothing worked — raise so the caller can fall back
        raise ValueError(f"Could not extract valid JSON from response: {text[:200]}")

    async def generate_content(
        self, 
        prompt: str, 
        response_schema: Optional[Any] = None, 
        temperature: float = 0.1,
        model_preference: str = "mistral",
        images: Optional[List[Any]] = None,
        audio: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """
        Attempts to generate content using Mistral as primary, Gemini as backup.
        If images are provided, it skips Mistral and goes directly to Gemini Flash.
        """
        # --- MULTIMODAL (Images/Audio): GO DIRECTLY TO GEMINI ---
        if (images or audio) and self.gemini_client:
            try:
                # Prepare parts list for the New google-genai types
                parts = [genai.types.Part.from_text(text=prompt)]
                
                if images:
                    for img in images:
                        parts.append(genai.types.Part.from_bytes(data=img['data'], mime_type=img['mime_type']))
                if audio:
                    for aud in audio:
                        parts.append(genai.types.Part.from_bytes(data=aud['data'], mime_type=aud['mime_type']))

                print(f"[GEMINI MULTIMODAL] Processing with {len(images or [])} images and {len(audio or [])} audio files...")
                
                # The SDK expects a list of Content objects, each with a list of Parts
                response = await asyncio.to_thread(
                    self.gemini_client.models.generate_content,
                    model='gemini-2.0-flash',
                    contents=[genai.types.Content(role='user', parts=parts)],
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json" if response_schema else "text/plain",
                        response_schema=response_schema,
                        temperature=temperature
                    )
                )
                if response_schema:
                    return self._extract_json(response.text)
                else:
                    return {"text": response.text}
            except Exception as e:
                print(f"Gemini Multimodal failed: {str(e)[:200]}")
                return {"error": f"Gemini Multimodal failure: {str(e)[:100]}"}

        # --- PRIMARY: MISTRAL (Text Only) ---
        if self.mistral_key and (model_preference == "mistral" or not self.gemini_client):
            try:
                # Ensure the word 'JSON' is in the prompt for structured outputs
                mistral_prompt = prompt
                if response_schema and "json" not in prompt.lower():
                    mistral_prompt += "\n\nPlease return the output in valid JSON format."

                async with httpx.AsyncClient() as client:
                    url = "https://api.mistral.ai/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {self.mistral_key}",
                        "Content-Type": "application/json"
                    }
                    data = {
                        "model": "mistral-large-latest",
                        "messages": [{"role": "user", "content": mistral_prompt}],
                        "temperature": temperature,
                        "response_format": {"type": "json_object"} if response_schema else {"type": "text"}
                    }
                    # Increase timeout to 120s to prevent ReadTimeout
                    timeout = httpx.Timeout(10.0, connect=10.0, read=120.0, pool=120.0)
                    response = await client.post(url, headers=headers, json=data, timeout=timeout)
                    
                    if response.status_code == 503:
                        print("Mistral 503 (Overload). Falling back to Gemini...")
                        raise httpx.HTTPStatusError("503", request=response.request, response=response)

                    if response.status_code != 200:
                        print(f"Mistral Error Status: {response.status_code}")
                        response.raise_for_status()

                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    print(f"[MISTRAL RAW] Length={len(content)}, First200={content[:200]}")
                    
                    if response_schema:
                        parsed = self._extract_json(content)
                        if isinstance(parsed, dict):
                            print(f"[MISTRAL PARSED OK] Keys={list(parsed.keys())}")
                        else:
                            print(f"[MISTRAL PARSED OK] List Length={len(parsed)}")
                        return parsed
                    else:
                        return {"text": content}
                        
            except Exception as e:
                print(f"Mistral lead failed ({type(e).__name__}): {str(e)[:200]}")
                return {"error": f"Mistral core failed and Gemini fallback is disabled for text. Error: {str(e)[:100]}"}

        # --- FINAL FALLBACK: ERROR ---
        return {"error": "No valid LLM provider configured for this request type."}

# Global factory instance
llm_factory = LLMFactory()
