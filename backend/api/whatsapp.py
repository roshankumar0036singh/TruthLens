import logging
import asyncio
from fastapi import APIRouter, Form, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
from services.whatsapp_service import whatsapp_service
from agents.orchestrator import orchestrator
from typing import Optional

router = APIRouter()
logger = logging.getLogger("truthlens.whatsapp_api")

@router.post("/webhook")
async def whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(default=""),
    MediaUrl0: Optional[str] = Form(default=None),
    NumMedia: int = Form(default=0)
):
    """
    Handles incoming WhatsApp messages and commands via Twilio Webhook.
    """
    cmd = Body.strip().lower()
    sender = From.replace("whatsapp:", "")
    
    # --- 1. COMMAND PARSER ---
    if cmd.startswith("!"):
        response = MessagingResponse()
        history = whatsapp_service.get_history(sender)
        
        if not history and cmd != "!help":
            response.message("🔍 *TRUTHLENS: HISTORY EMPTY*\nSend a claim, link, or image to start analysis first.")
            return Response(content=str(response), media_type="application/xml")

        if cmd == "!help":
            help_text = (
                "🤖 *TRUTHLENS WHATSAPP BOT HELP*\n"
                "------------------\n"
                "• Send any *Claim*, *URL*, or *Image* to start analysis.\n"
                "• `!citations` - View verified sources for the last check.\n"
                "• `!graph` - View relationship contradictions.\n"
                "• `!detailed` - View full agent score breakdown.\n"
                "• `!help` - Show this menu."
            )
            response.message(help_text)
        
        elif cmd == "!citations":
            response.message(whatsapp_service.format_citations(history))
        
        elif cmd == "!graph":
            response.message(whatsapp_service.format_graph_summary(history))
            
        elif cmd == "!detailed":
            response.message(whatsapp_service.format_detailed_scores(history))
            
        else:
            response.message(f"❌ Unknown command: `{cmd}`. Type `!help` for options.")
            
        return Response(content=str(response), media_type="application/xml")

    # --- 2. REGULAR ANALYSIS FLOW ---
    logger.info(f"WhatsApp Inbound: {From} -> {Body[:50]}")
    
    # Immediate TwiML Response
    response = MessagingResponse()
    initial_msg = "🔍 *TRUTHLENS: ANALYZING CLAIM...*"
    if NumMedia > 0:
        initial_msg += "\nDetecting media forensics and deepfake signals..."
    
    response.message(initial_msg)
    
    # Async Background Task for Swarm Analysis
    asyncio.create_task(process_claim_async(From, Body, MediaUrl0))
    
    return Response(content=str(response), media_type="application/xml")

async def process_claim_async(sender: str, text: str, media_url: Optional[str]):
    """Processes the claim, stores result in history, and sends final verdict."""
    to_phone = sender.replace("whatsapp:", "")
    try:
        # Determine Input for Orchestrator
        input_data = {
            "text": text if text else "Media Analysis Request",
            "media_urls": [media_url] if media_url else []
        }
        
        # Trigger Swarm Verification (Parallel Waves)
        result = await orchestrator.dispatch_parallel(input_data)
        
        if "error" in result:
             whatsapp_service.send_message(
                to=to_phone,
                body=f"⚠️ *TruthLens Error:* Swarm failed to resolve analysis. ({result['error']})"
            )
             return

        # 1. SAVE TO HISTORY (Redis)
        whatsapp_service.save_history(to_phone, result)

        # 2. Format and Send Final Verdict
        final_msg = whatsapp_service.format_verdict(result, text or "Media Analysis")
        whatsapp_service.send_message(to=to_phone, body=final_msg)
        
    except Exception as e:
        logger.error(f"process_claim_async error: {str(e)}")
        whatsapp_service.send_message(
            to=to_phone,
            body=f"⚠️ *TruthLens System Error:* An unexpected error occurred. ({str(e)})"
        )
