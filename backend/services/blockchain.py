import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

class BlockchainService:
    def __init__(self):
        self.rpc_url = os.getenv("RPC_URL", "http://127.0.0.1:8545") # Local Anvil/Hardhat
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.private_key = os.getenv("PRIVATE_KEY")
        
        # Explicit contract role addresses
        self.rep_address = os.getenv("REPUTATION_CONTRACT_ADDRESS")
        self.dao_address = os.getenv("DAO_CONTRACT_ADDRESS")
        
        # Fallback for legacy calls
        self.contract_address = self.rep_address or os.getenv("CONTRACT_ADDRESS")
        # In a real setup, we'd compile the contract and read the JSON
        self.abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "_contentUrl", "type": "string"},
                    {"internalType": "string", "name": "_assertion", "type": "string"}
                ],
                "name": "shareNews",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "_id", "type": "uint256"},
                    {"internalType": "bool", "name": "_isUpvote", "type": "bool"}
                ],
                "name": "voteOnNews",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]

    def is_connected(self):
        return self.w3.is_connected()

    def get_balance(self, address: str):
        """Returns balance in ETH/SHM."""
        try:
            balance_wei = self.w3.eth.get_balance(address)
            return self.w3.from_wei(balance_wei, 'ether')
        except Exception:
            return 0

    async def anchor_share(self, url: str, assertion: str):
        """
        Anchors a user share to the blockchain with balance safety.
        """
        if not self.private_key or not self.contract_address:
            return None

        try:
            account = Account.from_key(self.private_key)
            
            # Balance check before attempting Tx
            balance = self.get_balance(account.address)
            if balance < 0.01: # Threshold for 500k gas at average price
                print(f"Blockchain Warning: Insufficient funds ({balance} SHM). Skipping anchor.")
                return "pending_low_funds"

            contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
            nonce = self.w3.eth.get_transaction_count(account.address)
            chain_id = int(os.getenv("CHAIN_ID", self.w3.eth.chain_id))
            
            tx = contract.functions.shareNews(url, assertion).build_transaction({
                'chainId': chain_id,
                'gas': 800000, # Optimized down from 2M
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            return self.w3.to_hex(tx_hash)
        except Exception as e:
            if "insufficient funds" in str(e).lower():
                print("Blockchain: Insufficient funds for transaction.")
                return "pending_low_funds"
            print(f"Blockchain Anchor Error: {e}")
            return None

    async def anchor_content(self, article_id_hex: str, content_hash: str):
        """
        Anchors content integrity with balance safety.
        """
        if not self.private_key:
            return "0x-mock-integrity-hash"

        try:
            account = Account.from_key(self.private_key)
            balance = self.get_balance(account.address)
            if balance < 0.01:
                return f"offline_pending_{hash(content_hash)}"

            integrity_address = os.getenv("INTEGRITY_CONTRACT_ADDRESS", self.contract_address)
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            # Basic Transfer/Data anchor logic if contract ABI for integrity is complex
            tx = {
                'to': integrity_address,
                'value': 0,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
                'data': self.w3.to_hex(text=content_hash),
                'chainId': int(os.getenv("CHAIN_ID", 8082)),
            }
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return self.w3.to_hex(tx_hash)
        except Exception as e:
            print(f"Content Anchor Error: {e}")
            return f"0x-err-{hash(content_hash)}"

blockchain_service = BlockchainService()
