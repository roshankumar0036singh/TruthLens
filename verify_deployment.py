from web3 import Web3
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

rpc_url = os.getenv('RPC_URL', 'https://api-mezame.shardeum.org')
w3 = Web3(Web3.HTTPProvider(rpc_url))

contracts = {
    "Reputation SBT": os.getenv("REPUTATION_CONTRACT_ADDRESS"),
    "TruthDAO": os.getenv("DAO_CONTRACT_ADDRESS"),
    "ContentIntegrity": os.getenv("INTEGRITY_CONTRACT_ADDRESS"),
    "DeFactBridge": os.getenv("BRIDGE_CONTRACT_ADDRESS"),
    "TruthLensSocial": os.getenv("SOCIAL_CONTRACT_ADDRESS")
}

for name, addr in contracts.items():
    if not addr:
        print(f"{name}: NOT IN .ENV")
        continue
    
    try:
        code = w3.eth.get_code(addr)
        if code and len(code) > 2:
            print(f"{name}: DEPLOYED at {addr}")
        else:
            print(f"{name}: EMPTY at {addr}")
    except Exception as e:
        print(f"Error checking {name}: {e}")
