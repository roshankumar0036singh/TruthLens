import os
import solcx
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Load env vars from backend folder
load_dotenv('backend/.env')

# --- CONFIGURATION ---
RPC_URL = os.getenv("RPC_URL", "https://api-mezame.shardeum.org")
CHAIN_ID = int(os.getenv("CHAIN_ID", "8119"))
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
BASE_PATH = os.getcwd()

if not PRIVATE_KEY:
    print("MISSING PRIVATE_KEY IN .ENV")
    exit(1)

w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print("FAILED TO CONNECT TO SHARDEUM RPC")
    exit(1)

deployer = Account.from_key(PRIVATE_KEY)
print(f"Connected! Account: {deployer.address}")
print(f"Balance: {w3.from_wei(w3.eth.get_balance(deployer.address), 'ether')} SHM")

def setup_solc():
    try:
        solcx.set_solc_version('0.8.20')
    except:
        print("Installing solc 0.8.20...")
        solcx.install_solc('0.8.20')
        solcx.set_solc_version('0.8.20')

def compile_contract(contract_file, contract_name):
    """Compiles a flattened contract file using solcx."""
    print(f"\n--- Compiling {contract_name} (FLATTENED) ---")
    
    flat_file = contract_file.replace(".sol", ".flat.sol")
    full_path = os.path.join(BASE_PATH, "contracts", flat_file)
    
    compiled_sol = solcx.compile_files(
        [full_path],
        output_values=["abi", "bin"],
        solc_version="0.8.20",
        optimize=True,
        optimize_runs=200
    )
    
    # solcx labels flattened files with the absolute path
    key = f"{full_path}:{contract_name}"
    if key not in compiled_sol:
        # Fallback for relative path label
        key = f"contracts/{flat_file}:{contract_name}"
        if key not in compiled_sol:
             # Last resort: iterate keys
             matches = [k for k in compiled_sol.keys() if contract_name in k]
             if matches: key = matches[0]
             else: raise Exception(f"Contract {contract_name} not found in {compiled_sol.keys()}")

    return compiled_sol[key]['abi'], compiled_sol[key]['bin']

def deploy(abi, bytecode, args=None):
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(deployer.address)
    
    gas_price = w3.eth.gas_price
    if gas_price < 30000000000: gas_price = 30000000000 # Floor

    if args:
        tx_data = Contract.constructor(*args).build_transaction({
            'from': deployer.address,
            'nonce': nonce,
            'gas': 6000000,
            'gasPrice': gas_price,
            'chainId': CHAIN_ID
        })
    else:
        tx_data = Contract.constructor().build_transaction({
            'from': deployer.address,
            'nonce': nonce,
            'gas': 6000000,
            'gasPrice': gas_price,
            'chainId': CHAIN_ID
        })

    signed_tx = w3.eth.account.sign_transaction(tx_data, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Deployment Tx: {w3.to_hex(tx_hash)}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Deployed at: {receipt.contractAddress}")
    return receipt.contractAddress

def update_env(addresses):
    env_path = 'backend/.env'
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    keys_updated = set()
    
    for line in lines:
        match = False
        for key, value in addresses.items():
            if line.startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                keys_updated.add(key)
                match = True
                break
        if not match:
            new_lines.append(line)
            
    for key, value in addresses.items():
        if key not in keys_updated:
            new_lines.append(f"{key}={value}\n")
            
    with open(env_path, 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    setup_solc()
    
    # 1. Reputation
    rep_abi, rep_bin = compile_contract("TruthLensReputation.sol", "TruthLensReputation")
    rep_addr = deploy(rep_abi, rep_bin, [deployer.address])
    
    # 2. TruthDAO
    dao_abi, dao_bin = compile_contract("TruthDAO.sol", "TruthDAO")
    dao_addr = deploy(dao_abi, dao_bin, [rep_addr, deployer.address])
    
    # 3. DeFactBridge
    bridge_abi, bridge_bin = compile_contract("DeFactBridge.sol", "DeFactBridge")
    bridge_addr = deploy(bridge_abi, bridge_bin, [dao_addr, deployer.address])
    
    # 4. ContentIntegrity
    integr_abi, integr_bin = compile_contract("ContentIntegrity.sol", "ContentIntegrity")
    integr_addr = deploy(integr_abi, integr_bin, [deployer.address])
    
    # Update backend
    update_env({
        "REPUTATION_CONTRACT_ADDRESS": rep_addr,
        "DAO_CONTRACT_ADDRESS": dao_addr,
        "BRIDGE_CONTRACT_ADDRESS": bridge_addr,
        "INTEGRITY_CONTRACT_ADDRESS": integr_addr,
        "CONTRACT_ADDRESS": dao_addr # Legacy
    })
    
    print("\n--- DEPLOYMENT FINISHED ---")
    print(f"Reputation: {rep_addr}")
    print(f"DAO:        {dao_addr}")
    print(f"Bridge:     {bridge_addr}")
    print(f"Integrity:  {integr_addr}")
