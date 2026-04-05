from services.sentinel_service import sentinel_service
from services.discord_bot import start_discord_bot, bot
from fastapi import FastAPI
from api import verify, community, creator, marketplace, live_socket, headless_check, quests, whatsapp
from database import engine, Base
from agents import initialize_orchestrator
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="TruthLens Backend", version="1.1.0")

# Register agents to the orchestrator
initialize_orchestrator()

app.include_router(verify.router, prefix="/api/v1", tags=["verify"])
app.include_router(community.router, prefix="/api/v1/community", tags=["community"])
app.include_router(creator.router, prefix="/api/v1/creator", tags=["creator"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(live_socket.router, prefix="/api/v1", tags=["live-verify"])
app.include_router(headless_check.router, prefix="/api/v1/headless", tags=["headless"])
app.include_router(quests.router, prefix="/api/v1/quests", tags=["Quests"])
app.include_router(whatsapp.router, prefix="/api/v1/whatsapp", tags=["WhatsApp"])

@app.on_event("startup")
async def startup_event():
    # 0. Sync Database Schema (Ensures NarrativeTriplet table exists)
    async with engine.begin() as conn:
        # Note: In production, use migrations (Alembic). 
        # This is for hackathon/dev convenience.
        await conn.run_sync(Base.metadata.create_all)
    print("TruthLens Database: Schema Synchronized.")

    # 1. Start the Sentinel Autonomous Agent
    await sentinel_service.start()
    
    # 2. Subscribe Discord Bot to Sentinel Alerts
    sentinel_service.subscribe_to_alerts(bot.broadcast_alert)
    
    # 3. Launch the Discord Sentinel Bot (Background)
    asyncio.create_task(start_discord_bot())
    print("TruthLens Sentinel Bot: Activation Intent Dispatched.")

@app.get("/sync-wallet")
def sync_wallet_page():
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>TruthLens | Wallet Sync</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { 
                    background: #020617; 
                    color: #fff; 
                    font-family: 'Inter', sans-serif; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    height: 100vh; 
                    margin: 0;
                    background-image: 
                        radial-gradient(circle at 50% 50%, rgba(163, 230, 53, 0.05) 0%, transparent 50%),
                        linear-gradient(rgba(163, 230, 53, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(163, 230, 53, 0.02) 1px, transparent 1px);
                    background-size: 100% 100%, 40px 40px, 40px 40px;
                }
                .glass {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(163, 230, 53, 0.15);
                    border-radius: 40px;
                    padding: 60px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    max-width: 400px;
                    width: 90%;
                    position: relative;
                }
                .logo-ring {
                    width: 80px;
                    height: 80px;
                    border: 2px solid #a3e635;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 30px;
                    box-shadow: 0 0 20px rgba(163, 230, 53, 0.2);
                }
                h1 { 
                    font-size: 32px;
                    font-weight: 900;
                    text-transform: uppercase; 
                    letter-spacing: -0.05em;
                    margin: 0 0 10px 0;
                    background: linear-gradient(to bottom, #fff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p { 
                    color: #94a3b8; 
                    font-size: 14px; 
                    line-height: 1.6;
                    margin: 0 0 40px 0;
                    font-weight: 500;
                }
                .btn { 
                    background: #a3e635; 
                    color: #020617; 
                    border: none; 
                    padding: 20px 40px; 
                    border-radius: 20px; 
                    font-weight: 900; 
                    text-transform: uppercase; 
                    font-size: 13px;
                    letter-spacing: 0.1em;
                    cursor: pointer; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    width: 100%;
                    box-shadow: 0 10px 25px -5px rgba(163, 230, 53, 0.3);
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 35px -5px rgba(163, 230, 53, 0.4);
                    filter: brightness(1.1);
                }
                .btn:active {
                    transform: scale(0.98);
                }
                #status { 
                    margin-top: 25px; 
                    color: #a3e635; 
                    font-size: 11px; 
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    display: none; 
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
        </head>
        <body>
            <div class="glass">
                <div class="logo-ring">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <h1>Sync identity.</h1>
                <p>Establishing secure bridge between your web wallet and the TruthLens hub.</p>
                <button id="syncBtn" class="btn">Connect MetaMask</button>
                <div id="status">Syncing to TruthLens Extension...</div>
            </div>
            <script>
                const urlParams = new URLSearchParams(window.location.search);
                const extId = urlParams.get('id');

                document.getElementById('syncBtn').onclick = async () => {
                    if (!window.ethereum) { 
                        alert("MetaMask not found in this browser context."); 
                        return; 
                    }
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                        if (accounts[0] && extId) {
                            document.getElementById('status').style.display = 'block';
                            document.getElementById('syncBtn').innerText = "LINKED SUCCESS";
                            document.getElementById('syncBtn').style.opacity = '0.7';
                            
                            chrome.runtime.sendMessage(extId, { type: 'TRUTHLENS_SYNC', address: accounts[0] }, (response) => {
                                document.getElementById('status').innerText = "Closing Secure Bridge...";
                                setTimeout(() => window.close(), 1200);
                            });
                        } else if (!extId) {
                            alert("Fatal: Extension ID missing. Please return to Hub and retry.");
                        }
                    } catch (e) { 
                        alert("Connection sequence rejected by user."); 
                    }
                };
            </script>
        </body>
        </html>
    """)

@app.get("/transact")
def transaction_bridge_page(action: str, verdict_id: int = 0):
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>TruthLens | Secure Transaction</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body {{ background: #020617; color: #fff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                .glass {{ background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(163, 230, 53, 0.15); border-radius: 40px; padding: 60px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); max-width: 400px; }}
                h1 {{ font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0 0 10px 0; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
                p {{ color: #94a3b8; font-size: 14px; margin: 0 0 40px 0; }}
                .btn {{ background: #a3e635; color: #020617; border: none; padding: 20px 40px; border-radius: 20px; font-weight: 900; font-size: 13px; cursor: pointer; width: 100%; text-transform: uppercase; }}
                #status {{ margin-top: 25px; color: #a3e635; font-size: 11px; font-weight: 800; text-transform: uppercase; }}
            </style>
        </head>
        <body>
            <div class="glass">
                <h1>Secure Bridge.</h1>
                <p>Action Required: Confirm <b>{action.replace('_', ' ').upper()}</b> via MetaMask on Shardeum Mezzame.</p>
                <button id="txBtn" class="btn">Confirm on Shardeum</button>
                <div id="status" style="display:none">SIGNING TRANSACTION...</div>
            </div>
            <script src="https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js"></script>
            <script>
                const TRUTH_DAO = "0x02C79dB0e3701FB13Dec2A29EE9c93aEfFAf5F6D";
                const ABI = [
                    "function vote(uint256 disputeId, bool support) public",
                    "function createDispute(string url, string verdict) public payable"
                ];

                document.getElementById('txBtn').onclick = async () => {{
                    if (typeof ethers === 'undefined') {{
                        alert("Ethers library failed to load. Please check your internet connection.");
                        return;
                    }}
                    if (!window.ethereum) {{ alert("MetaMask not found!"); return; }}
                    const status = document.getElementById('status');
                    status.style.display = 'block';
                    status.innerText = 'SWITCHING TO SHARDEUM...';

                    try {{
                        // Force switch to Shardeum Mezame Testnet
                        try {{
                            await window.ethereum.request({{
                                method: 'wallet_switchEthereumChain',
                                params: [{{ chainId: '0x1FB7' }}], // 8119 in hex
                            }});
                        }} catch (switchError) {{
                            // Chain not added yet - add it automatically
                            if (switchError.code === 4902) {{
                                await window.ethereum.request({{
                                    method: 'wallet_addEthereumChain',
                                    params: [{{
                                        chainId: '0x1FB7',
                                        chainName: 'Shardeum Mezame',
                                        nativeCurrency: {{ name: 'SHM', symbol: 'SHM', decimals: 18 }},
                                        rpcUrls: ['https://api-mezame.shardeum.org'],
                                        blockExplorerUrls: ['https://explorer-mezame.shardeum.org'],
                                    }}],
                                }});
                            }} else {{
                                throw switchError;
                            }}
                        }}

                        status.innerText = 'SIGNING TRANSACTION...';
                        const provider = new ethers.providers.Web3Provider(window.ethereum);
                        await provider.send("eth_requestAccounts", []);
                        const signer = provider.getSigner();
                        const contract = new ethers.Contract(TRUTH_DAO, ABI, signer);

                        let tx;
                        if ('{action}' === 'vote_up') tx = await contract.vote({verdict_id}, true);
                        if ('{action}' === 'vote_down') tx = await contract.vote({verdict_id}, false);
                        if ('{action}' === 'dispute') tx = await contract.createDispute("truthlens://verify", "FALSE", {{ value: ethers.utils.parseEther("0.01") }});

                        status.innerText = "TX PENDING: " + tx.hash;
                        await tx.wait();
                        status.innerText = "SUCCESS — CLOSING BRIDGE...";
                        setTimeout(() => window.close(), 1500);
                    }} catch (e) {{
                        alert("Transaction failed: " + e.message);
                        status.style.display = 'none';
                    }}
                }};
            </script>
        </body>
        </html>
    """)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "TruthLens Backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
