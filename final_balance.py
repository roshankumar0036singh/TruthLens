from web3 import Web3
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

rpc_url = 'https://api-mezame.shardeum.org'
w3 = Web3(Web3.HTTPProvider(rpc_url))
addr = '0x6b676F798bFB046AA241AE3C18CD3cDec399c38C'

balance_wei = w3.eth.get_balance(addr)
print(f"Final Address: {addr}")
print(f"Final Balance: {w3.from_wei(balance_wei, 'ether')} SHM")
print(f"Gas Price (Raw): {w3.eth.gas_price} Wei")
