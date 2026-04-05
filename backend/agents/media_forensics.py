import os
from typing import Dict, Any, List
import httpx
from io import BytesIO
import exifread
import base64
from .base import BaseAgent

class MediaForensicsAgent(BaseAgent):
    """
    Agent 4: Media Forensics.
    Handles verification of images, videos (keyframes), and audio using Multimodal APIs.
    """
    def __init__(self):
        super().__init__("MediaForensics")
        self.gemini_key = os.getenv("GEMINI_API_KEY")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        images_for_analysis = []
        audio_for_analysis = []
        exif_reports = []
        
        media_urls = input_data.get("media_urls", [])
        base64_image = input_data.get("base64_image")
        base64_audio = input_data.get("base64_audio")
        
        if not media_urls and not base64_image and not base64_audio:
            return {"media_analyzed": False, "status": "No media (Image/Audio) provided"}
            
        # 1. Download and Process Media (Focus on Images first)
        images_for_analysis = []
        exif_reports = []
        
        async with httpx.AsyncClient() as client:
            for url in media_urls[:3]:  # Limit to 3 images for latency
                try:
                    resp = await client.get(url, timeout=10.0)
                    if resp.status_code == 200:
                        img_bytes = resp.content
                        images_for_analysis.append({"mime_type": "image/jpeg", "data": img_bytes})
                        
                        # 2. EXIF Metadata Extraction
                        f = BytesIO(img_bytes)
                        tags = exifread.process_file(f, details=False)
                        if tags:
                            exif_reports.append({
                                "url": url,
                                "make": str(tags.get("Image Make", "Unknown")),
                                "model": str(tags.get("Image Model", "Unknown")),
                                "datetime": str(tags.get("Image DateTime", "Unknown")),
                                "software": str(tags.get("Software", "None"))
                            })
                except Exception as e:
                    print(f"Failed to process media {url}: {e}")

        # 1.5 Handle Base64 Image
        if base64_image:
            try:
                if "," in base64_image:
                    base64_image = base64_image.split(",")[1]
                img_bytes = base64.b64decode(base64_image)
                images_for_analysis.append({"mime_type": "image/jpeg", "data": img_bytes})
                
                f = BytesIO(img_bytes)
                tags = exifread.process_file(f, details=False)
                if tags:
                    exif_reports.append({
                        "url": "local_upload",
                        "make": str(tags.get("Image Make", "Unknown")),
                        "model": str(tags.get("Image Model", "Unknown")),
                        "datetime": str(tags.get("Image DateTime", "Unknown")),
                        "software": str(tags.get("Software", "None"))
                    })
            except Exception as e:
                print(f"Failed to process base64 image: {e}")

        # 1.6 Handle Base64 Audio (New Feature 1 Upgrade)
        if base64_audio:
            try:
                if "," in base64_audio:
                    base64_audio = base64_audio.split(",")[1]
                aud_bytes = base64.b64decode(base64_audio)
                # Gemini 2.0 Flash supports 10min+ audio via raw data
                audio_for_analysis.append({"mime_type": "audio/wav", "data": aud_bytes})
            except Exception as e:
                print(f"Failed to process base64 audio: {e}")

        # 3. Multimodal Analysis with Gemini 2.0 Flash
        analysis_prompt = f"""
        Analyze the provided media (Image/Audio) against this claim.
        CLAIM: "{input_data.get('text', '')}"
        
        FORENSIC TASKS:
        1. IMAGE CHECK (If applicable): Look for GAN/Diffusion artifacts (smoothing, abnormal geometry).
        2. AUDIO CHECK (If applicable): Analyze for "Speech Cloning" signatures:
           - Unnatural robotic cadence or lack of emotional breathiness.
           - Repeated frequency "loops" in background noise.
           - Check for metadata inconsistency between the speaker's tone and the claim's intensity.
        3. VERDICT: provide a combined forensic confidence score (0-100).
        
        Return JSON with keys: score, insights (string list), flags (string list), and is_ai_generated (bool).
        """
        
        forensic_report = await self.generate_response(
            analysis_prompt, 
            response_schema={"type": "object", "properties": {
                "score": {"type": "number"},
                "insights": {"type": "array", "items": {"type": "string"}},
                "flags": {"type": "array", "items": {"type": "string"}},
                "is_ai_generated": {"type": "boolean"}
            }},
            images=images_for_analysis,
            audio=audio_for_analysis
        )
        
        # 4. Integrate EXIF Signals
        score = forensic_report.get("score", 50)
        flags = forensic_report.get("flags", [])
        
        if exif_reports:
            for report in exif_reports:
                if "Photoshop" in report.get("software", ""):
                    score -= 10
                    flags.append(f"Image edited with {report['software']}")
                if report.get("datetime") == "Unknown":
                    flags.append("Warning: Missing capture timestamp (EXIF stripped)")

        return {
            "media_analyzed": True,
            "forensic_score": max(0, min(100, score)),
            "is_ai_generated": forensic_report.get("is_ai_generated", False),
            "vision_insights": forensic_report.get("insights", []),
            "forensic_flags": flags,
            "exif_metadata": exif_reports,
            "audio_checked": len(audio_for_analysis) > 0,
            "status": "success"
        }

    async def health_check(self) -> bool:
        return True # Add actual Vision API key checks here
