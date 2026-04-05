import os
import json
import solcx
import time
from web3 import Web3
from dotenv import load_dotenv

# Load env vars from backend folder
load_dotenv('backend/.env')

# --- CONFIGURATION ---
RPC_URL = os.getenv("RPC_URL", "https://api-mezame.shardeum.org")
CHAIN_ID = int(os.getenv("CHAIN_ID", "8119"))
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

if not PRIVATE_KEY:
    print("MISSING PRIVATE_KEY IN .ENV")
    exit(1)

print(f"Connecting to RPC: {RPC_URL}...")
w3 = Web3(Web3.HTTPProvider(RPC_URL))

if not w3.is_connected():
    print("FAILED TO CONNECT TO SHARDEUM RPC")
    exit(1)

# Derive address from private key
from_account = w3.eth.account.from_key(PRIVATE_KEY)
ACCOUNT_ADDRESS = from_account.address

balance = w3.eth.get_balance(ACCOUNT_ADDRESS)
print(f"Connected! Account: {ACCOUNT_ADDRESS}")
print(f"Balance: {w3.from_wei(balance, 'ether')} SHM")

# --- SOLC SETUP ---
print(f"Ensuring solc 0.8.20 is ready...")
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
    
    if 'errors' in compiled_sol:
        for err in compiled_sol['errors']:
            if err['severity'] == 'error':
                print(f"[ERROR] {err['message']}")
        if any(err['severity'] == 'error' for err in compiled_sol['errors']):
             raise Exception("Compilation failed.")

    contract_data = compiled_sol['contracts'][contract_path][contract_name]
    print("Compilation successful!")
    return contract_data['abi'], contract_data['evm']['bytecode']['object']

def deploy_contract(abi, bytecode, args=None):
    print(f"Preparing deployment transaction...")
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(ACCOUNT_ADDRESS)
    
    gas_price = int(w3.eth.gas_price * 1.2)
    if gas_price < 20000000000: # 20 Gwei min
        gas_price = 20000000000

    tx_params = {
        'chainId': CHAIN_ID,
        'gas': 2200000, 
        'gasPrice': gas_price,
        'nonce': nonce,
        'from': ACCOUNT_ADDRESS
    }

    if args:
        construct_tx = Contract.constructor(*args).build_transaction(tx_params)
    else:
        construct_tx = Contract.constructor().build_transaction(tx_params)

    print("Signing transaction...")
    signed_tx = w3.eth.account.sign_transaction(construct_tx, PRIVATE_KEY)
    
    print("Sending raw transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction hash: {w3.to_hex(tx_hash)}")
    
    print("Waiting for receipt...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    print(f"Successfully deployed at: {receipt.contractAddress}")
    return receipt.contractAddress

if __name__ == "__main__":
    try:
        REPUTATION_SBT = os.getenv("REPUTATION_CONTRACT_ADDRESS")
        
        # 1. TruthDAO
        dao_abi, dao_bin = compile_contract('contracts/TruthDAO.sol', 'TruthDAO')
        dao_address = deploy_contract(dao_abi, dao_bin, args=[REPUTATION_SBT, ACCOUNT_ADDRESS])
        
        # 2. DeFactBridge
        bridge_abi, bridge_bin = compile_contract('contracts/DeFactBridge.sol', 'DeFactBridge')
        # Lower gas limit for the Bridge as it is smaller
        bridge_gas = 1200000
        bridge_nonce = w3.eth.get_transaction_count(ACCOUNT_ADDRESS)
        bridge_receipt = deploy_contract(bridge_abi, bridge_bin, args=[dao_address, ACCOUNT_ADDRESS])
        bridge_address = bridge_receipt

        print(f"\n--- CORE DEPLOYMENT SUCCESSFUL ---")
        print(f"TruthDAO:     {dao_address}")
        print(f"DeFactBridge: {bridge_address}")
        
    except Exception as e:
        print(f"\nFATAL ERROR: {str(e)}")
