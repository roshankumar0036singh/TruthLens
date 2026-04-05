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
    print(f"\n--- Compiling {contract_name} (Self-Contained) ---")
    project_root = os.getcwd()

    with open(contract_path, "r", encoding='utf-8') as f:
        source = f.read()

    input_json = {
        "language": "Solidity",
        "sources": {contract_path: {"content": source}},
        "settings": {
            "optimizer": {"enabled": True, "runs": 200},
            "evmVersion": "shanghai",
            "outputSelection": {"*": {"*": ["abi", "evm.bytecode"]}}
        }
    }

    print(f"Compiling {contract_path}...")
    compiled_sol = solcx.compile_standard(
        input_json, 
        base_path=project_root,
        allow_paths=[project_root]
    )
    
    if 'errors' in compiled_sol:
        has_error = False
        for err in compiled_sol['errors']:
            if err['severity'] == 'error':
                print(f"[{err['severity'].upper()}] {err['message']}")
                has_error = True
        if has_error:
            raise Exception("Compilation failed")

    contract_data = compiled_sol['contracts'][contract_path][contract_name]
    print("Compilation successful!")
    return contract_data['abi'], contract_data['evm']['bytecode']['object']

def deploy_contract(abi, bytecode, args=None):
    print(f"Preparing deployment transaction...")
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(ACCOUNT_ADDRESS)
    
    # Using 'Break-The-Wall' 2.5M Gwei price for high-balance 20,000 SHM wallet
    # Estimated Cost per contract: ~6.25 SHM
    gas_price = 2500000000000000 

    tx_params = {
        'chainId': CHAIN_ID,
        'gas': 2500000, 
        'gasPrice': gas_price,
        'nonce': nonce,
        'from': ACCOUNT_ADDRESS
    }

    if args:
        construct_tx = Contract.constructor(*args).build_transaction(tx_params)
    else:
        construct_tx = Contract.constructor().build_transaction(tx_params)

    print(f"Estimated Cost: {w3.from_wei(construct_tx['gas'] * construct_tx['gasPrice'], 'ether')} SHM")
    
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
        # LIVE CONTRACTS
        LIVE_REPUTATION_SBT = "0xbc52F50138E6D21DD370439162d3647745f52aDf"
        LIVE_DAO_ADDRESS = "0x02C79dB0e3701FB13Dec2A29EE9c93aEfFAf5F6D"

        # ECOSYSTEM CONTRACTS
        
        # 1. Content Integrity
        # Requires initialOwner address
        integrity_abi, integrity_bin = compile_contract('contracts/ContentIntegrity.sol', 'ContentIntegrity')
        integrity_address = deploy_contract(integrity_abi, integrity_bin, args=[ACCOUNT_ADDRESS])
        
        # 2. DeFact Bridge
        # Requires _dao and initialOwner addresses
        bridge_abi, bridge_bin = compile_contract('contracts/DeFactBridge.sol', 'DeFactBridge')
        bridge_address = deploy_contract(bridge_abi, bridge_bin, args=[LIVE_DAO_ADDRESS, ACCOUNT_ADDRESS])
        
        # 3. TruthLens Social
        # No arguments required
        social_abi, social_bin = compile_contract('contracts/TruthLensSocial.sol', 'TruthLensSocial')
        social_address = deploy_contract(social_abi, social_bin)

        print(f"\n--- ECOSYSTEM DEPLOYMENT SUCCESSFUL ---")
        print(f"Integrity: {integrity_address}")
        print(f"Bridge:    {bridge_address}")
        print(f"Social:    {social_address}")
        
    except Exception as e:
        print(f"\nFATAL ERROR: {str(e)}")
