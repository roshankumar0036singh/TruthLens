import json
import base64
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from agents.transcription import TranscriptionAgent
from agents.orchestrator import orchestrator

router = APIRouter()
transcriber = TranscriptionAgent()

@router.websocket("/ws/live-verify")
async def websocket_live_verify(websocket: WebSocket):
    """
    WebSocket for Real-time Audio Fact-Checking.
    Ingests binary audio chunks, transcribes, and streams back 'Live Truth Feed'.
    """
    await websocket.accept()
    print("Live Audio Feed: Connection Established.")
    
    try:
        while True:
            # 1. Receive binary chunk (Base64 encoded string from client)
            data = await websocket.receive_text()
            message = json.loads(data)
            
            audio_b64 = message.get("audio")
            if not audio_b64:
                continue

            # 2. Transcribe and extract claims
            # We process chunks sequentially to maintain context
            transcription_result = await transcriber.run({"audio_bytes": base64.b64decode(audio_b64)})
            
            if transcription_result.get("is_fact_worthy"):
                claims = transcription_result.get("claims", [])
                
                # 3. Stream individual claim verifications back
                for claim in claims:
                    await websocket.send_json({
                        "type": "transcription",
                        "text": transcription_result.get("transcription"),
                        "active_claim": claim,
                        "status": "verifying"
                    })
                    
                    # Run full verification pipeline for each identified claim
                    # This happens in parallel-ish per claim but synced to this WebSocket
                    async for update in orchestrator.stream_verification({"text": claim}):
                        # Send granular updates (agent by agent) to the live overlay
                        await websocket.send_json({
                            "type": "verification_update",
                            "claim": claim,
                            **update
                        })

            else:
                # Still send the transcription even if no claims are found
                await websocket.send_json({
                    "type": "transcription",
                    "text": transcription_result.get("transcription"),
                    "is_fact_worthy": False
                })

    except WebSocketDisconnect:
        print("Live Audio Feed: Client Disconnected.")
    except Exception as e:
        print(f"Live Audio Feed Error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass

def register_live_socket(app):
    app.include_router(router)
