from web3 import Web3
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

rpc_url = os.getenv('RPC_URL', 'https://api-mezame.shardeum.org')
w3 = Web3(Web3.HTTPProvider(rpc_url))
private_key = os.getenv('PRIVATE_KEY')
acc = w3.eth.account.from_key(private_key)

print(f"Address: {acc.address}")
try:
    balance_wei = w3.eth.get_balance(acc.address)
    print(f"Balance: {w3.from_wei(balance_wei, 'ether')} SHM")
except Exception as e:
    print(f"Error fetching balance: {e}")
