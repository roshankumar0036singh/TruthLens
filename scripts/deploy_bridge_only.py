import os
import json
import solcx
import time
from web3 import Web3
from dotenv import load_dotenv

# Load env vars from backend folder
load_dotenv('backend/.env')

# --- CONFIGURATION ---
RPC_URL = "https://api-mezame.shardeum.org"
CHAIN_ID = 8119
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
NEW_DAO_ADDRESS = "0x6a89FE31E4b4c5ca48bEC6720a6cDD2a01e82dfC"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
from_account = w3.eth.account.from_key(PRIVATE_KEY)
ACCOUNT_ADDRESS = from_account.address

print(f"Connected! Account: {ACCOUNT_ADDRESS}")
print(f"Balance: {w3.from_wei(w3.eth.get_balance(ACCOUNT_ADDRESS), 'ether')} SHM")

# --- SOLC SETUP ---
solcx.install_solc('0.8.20')
solcx.set_solc_version('0.8.20')

def compile_contract(contract_path, contract_name):
    print(f"\n--- Compiling {contract_name} ---")
    project_root = os.getcwd()
    with open(contract_path, "r", encoding='utf-8') as f:
        source = f.read()

    compiled_sol = solcx.compile_standard(
        {
            "language": "Solidity",
            "sources": {contract_path: {"content": source}},
            "settings": {
                "optimizer": {"enabled": True, "runs": 200},
                "evmVersion": "shanghai",
                "outputSelection": {"*": {"*": ["abi", "evm.bytecode"]}}
            }
        },
        base_path=project_root,
        allow_paths=[project_root]
    )
    contract_data = compiled_sol['contracts'][contract_path][contract_name]
    return contract_data['abi'], contract_data['evm']['bytecode']['object']

def deploy_contract(abi, bytecode, args=None):
    print(f"Preparing bridge deployment transaction...")
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(ACCOUNT_ADDRESS)
    
    # Use real gas price from network
    gas_price = w3.eth.gas_price
    
    # TIGHT GAS LIMIT TO FIT IN 2.8K SHM
    # 800,000 gas * 2.3e15 gas_price = 1.84e21 (1,840 SHM)
    gas_limit = 800000 

    tx_params = {
        'chainId': CHAIN_ID,
        'gas': gas_limit, 
        'gasPrice': gas_price,
        'nonce': nonce,
        'from': ACCOUNT_ADDRESS
    }

    print(f"Gas Price: {w3.from_wei(gas_price, 'gwei')} Gwei")
    print(f"Gas Limit: {gas_limit}")
    print(f"Max Cost:  {w3.from_wei(gas_limit * gas_price, 'ether')} SHM")

    construct_tx = Contract.constructor(*args).build_transaction(tx_params)
    signed_tx = w3.eth.account.sign_transaction(construct_tx, PRIVATE_KEY)
    
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction hash: {w3.to_hex(tx_hash)}")
    
    print("Waiting for receipt...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    print(f"Successfully deployed at: {receipt.contractAddress}")
    return receipt.contractAddress

if __name__ == "__main__":
    try:
        bridge_abi, bridge_bin = compile_contract('contracts/DeFactBridge.sol', 'DeFactBridge')
        bridge_address = deploy_contract(bridge_abi, bridge_bin, args=[NEW_DAO_ADDRESS, ACCOUNT_ADDRESS])
        print(f"\n--- BRIDGE DEPLOYMENT SUCCESSFUL ---")
        print(f"New DAO:    {NEW_DAO_ADDRESS}")
        print(f"New Bridge: {bridge_address}")
    except Exception as e:
        print(f"\nFATAL ERROR: {str(e)}")
