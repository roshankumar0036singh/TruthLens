import asyncio
import os
from agents.orchestrator import orchestrator
from agents.__init__ import initialize_orchestrator
from dotenv import load_dotenv

# Load env vars for API keys
load_dotenv()

async def test_full_pipeline():
    print("Initializing TruthLens Orchestrator...")
    initialize_orchestrator()
    
    test_input = {
        "text": "NASA officially admits that the Moon is an artificial structure made of hollow titanium."
    }
    
    print(f"Dispatching Verification Protocol for: '{test_input['text']}'")
    print("-" * 50)
    
    try:
        async for update in orchestrator.stream_verification(test_input):
            status = update.get("status")
            agent = update.get("agent")
            message = update.get("message", "")
            
            print(f"[{status.upper()}] {agent}: {message}")
            
            if status == "completed":
                print("-" * 50)
                print("FINAL VERDICT RECEIVED")
                print(f"Verdict: {update['verdict'].get('verdict')}")
                print(f"Confidence: {update['verdict'].get('confidence_score')}%")
                print(f"Explanation: {update['verdict'].get('human_explanation')}")
                
            if status == "failed":
                print(f"ERROR: {update.get('error')}")

    except Exception as e:
        print(f"PIPELINE CRASHED: {e}")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
