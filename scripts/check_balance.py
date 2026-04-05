import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv('backend/.env')

RPC_URL = "https://api-mezame.shardeum.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

if PRIVATE_KEY:
    addr = w3.eth.account.from_key(PRIVATE_KEY).address
    balance = w3.eth.get_balance(addr)
    print(f"\n========================================")
    print(f"TRUTHLENS OS - WALLET STATUS")
    print(f"========================================")
    print(f"Address:  {addr}")
    print(f"Balance:  {w3.from_wei(balance, 'ether')} SHM")
    print(f"Status:   {'READY' if balance > 60000000000000000 else 'INSUFFICIENT FUNDS'}")
    print(f"Required: 0.06 SHM (Estimated)")
    print(f"========================================\n")
else:
    print("No Private Key found in .env")
