import os
import logging
import json
import redis
from typing import Dict, Any, List, Optional
from twilio.rest import Client
from pydantic_settings import BaseSettings

from pydantic_settings import BaseSettings, SettingsConfigDict

class WhatsAppSettings(BaseSettings):
    TWILIO_ACCOUNT_SID: str = "US78f2703eda967fcdb6f8e54ad3b3e6b6"
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = WhatsAppSettings()
logger = logging.getLogger("truthlens.whatsapp")

class WhatsAppService:
    def __init__(self):
        # 1. Initialize Twilio Client
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        else:
            self.client = None
            logger.warning("WhatsApp Service: Twilio credentials missing.")

        # 2. Initialize Redis for History tracking
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            logger.info("WhatsApp Service: Redis connection successful.")
        except Exception as e:
            self.redis = None
            logger.error(f"WhatsApp Service: Redis connection failed: {e}")

    def save_history(self, user_phone: str, result: Dict[str, Any]):
        """Stores the latest analysis result in Redis for retrieval by commands."""
        if not self.redis: return
        key = f"truthlens:wa:history:{user_phone}"
        try:
            self.redis.setex(key, 86400, json.dumps(result)) # 24h expiry
        except Exception as e:
            logger.error(f"Failed to save WA history: {e}")

    def get_history(self, user_phone: str) -> Optional[Dict[str, Any]]:
        """Retrieves the last analysis result for a user."""
        if not self.redis: return None
        key = f"truthlens:wa:history:{user_phone}"
        try:
            data = self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get WA history: {e}")
            return None

    def send_message(self, to: str, body: str, media_url: str = None):
        """Sends a WhatsApp message using Twilio."""
        if not self.client:
            logger.error("WhatsApp Service: Client not initialized.")
            return None
        
        try:
            params = {
                "from_": settings.TWILIO_WHATSAPP_NUMBER,
                "body": body,
                "to": f"whatsapp:{to}" if not to.startswith("whatsapp:") else to
            }
            if media_url:
                params["media_url"] = [media_url]
            
            message = self.client.messages.create(**params)
            return message.sid
        except Exception as e:
            logger.error(f"WhatsApp Service send error: {str(e)}")
            return None

    def format_verdict(self, result: Dict[str, Any], original_input: str) -> str:
        """Standard verdict format with hints for advanced features."""
        verdict = result.get("final_verdict", {})
        status = verdict.get("verdict", "UNKNOWN")
        confidence = verdict.get("confidence_score", 0)
        explanation = verdict.get("human_explanation", "No explanation provided.")
        
        emoji = "✅" if status == "VERIFIED" else ("❌" if status == "FALSE" else "⚠️")
        
        msg = [
            f"{emoji} *TRUTHLENS VERDICT: {status}*",
            f"_{original_input[:100]}..._",
            "",
            f"📊 *Confidence:* {confidence:.1f}%",
            f"🧠 *AI Synthesis:* {explanation}",
            "",
            "*Key Signals:*",
        ]
        
        for r in verdict.get("key_reasons", [])[:3]:
            msg.append(f"• {r}")
        
        if verdict.get("quest_tx_hash"):
            msg.append(f"\n🔗 *On-Chain Proof:* https://explorer-mezame.shardeum.org/tx/{verdict['quest_tx_hash']}")
        
        msg.append("\n---")
        msg.append("💡 *Reply with:*")
        msg.append("• `!citations` - View verified sources")
        msg.append("• `!graph` - View relationship contradictions")
        msg.append("• `!detailed` - View full score breakdown")
        msg.append("• `!help` - More commands")
        
        return "\n".join(msg)

    def format_citations(self, result: Dict[str, Any]) -> str:
        """Formats the CitationFinder report for WhatsApp."""
        reports = result.get("detailed_reports", {}).get("CitationFinder", {}).get("citation_report", [])
        if not reports: return "❌ No specific citations found for this claim."
        
        msg = ["📜 *TRUTHLENS: VERIFIED CITATIONS*", ""]
        for report in reports:
            for evidence in report.get("evidence", [])[:5]:
                stance_emoji = "✅" if evidence['stance'] == "APPROVE" else ("❌" if evidence['stance'] == "DISAPPROVE" else "⚪")
                msg.append(f"{stance_emoji} *{evidence['source']}*")
                msg.append(f"_{evidence['reasoning'][:150]}_")
                msg.append(f"🔗 {evidence['url']}\n")
        
        return "\n".join(msg)

    def format_graph_summary(self, result: Dict[str, Any]) -> str:
        """Formats the Graph RAG summary findings."""
        graph = result.get("detailed_reports", {}).get("GraphRAG", {}).get("graph_analytics", {})
        if not graph: return "❌ No knowledge graph data available for this claim."
        
        msg = ["🕸️ *TRUTHLENS: KNOWLEDGE GRAPH SUMMARY*", ""]
        msg.append(f"Nodes: {graph.get('total_nodes', 0)} | Edges: {graph.get('total_edges', 0)}")
        msg.append(f"Density: {graph.get('graph_density', 0):.4f}\n")
        
        contradictions = graph.get("contradictions", [])
        if contradictions:
            msg.append("⚠️ *CONTRADICTIONS DETECTED:*")
            for c in contradictions[:3]:
                msg.append(f"• *Claim:* {c['claim_relation']}")
                msg.append(f"  *Reality:* {c['factual_relation']}\n")
        else:
            msg.append("✅ No topological relationship contradictions detected.")
            
        return "\n".join(msg)

    def format_detailed_scores(self, result: Dict[str, Any]) -> str:
        """Breakdown of all agent scores."""
        reports = result.get("detailed_reports", {})
        msg = ["📊 *TRUTHLENS: DETAILED SCORECARD*", ""]
        
        # Forensic Scan
        forensics = reports.get("MediaForensics", {})
        if forensics.get("media_analyzed"):
            msg.append(f"🖼️ *Forensic Score:* {forensics.get('forensic_score', 0)}/100")
            msg.append(f"   AI Generated: {'YES 🤖' if forensics.get('is_ai_generated') else 'NO 👤'}\n")
            
        # Sentiment
        sentiment = reports.get("Sentiment", {})
        if sentiment:
            msg.append(f"🎭 *Sentiment:* {sentiment.get('primary_emotion', 'N/A')} ({sentiment.get('sentiment_score', 0)})")
            msg.append(f"   Subjectivity: {sentiment.get('subjectivity', 'N/A')}\n")
            
        # Viral Tracker
        viral = reports.get("ViralTracker", {})
        if viral:
            msg.append(f"📈 *Viral Risk:* {viral.get('viral_risk_score', 'N/A')}/100")
            msg.append(f"   Velocity: {viral.get('narrative_velocity', 'Low')}\n")

        msg.append("\n_Full breakdown available in TruthLens Dashboard_")
        return "\n".join(msg)

whatsapp_service = WhatsAppService()
