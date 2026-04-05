import os
from eth_account import Account
from web3 import Web3
from typing import Optional
from .blockchain import blockchain_service

class DAOService:
    """
    Handles TruthDAO on-chain interactions: Staking disputes and community voting.
    """
    def __init__(self):
        self.contract_address = os.getenv("DAO_CONTRACT_ADDRESS")
        # Initialize with the deployed DAO contract ABI if available
        self.abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "_url", "type": "string"},
                    {"internalType": "string", "name": "_verdict", "type": "string"}
                ],
                "name": "createDispute",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "_disputeId", "type": "uint256"},
                    {"internalType": "bool", "name": "_support", "type": "bool"}
                ],
                "name": "vote",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]

    async def stake_dispute(self, url: str, verdict: str, amount_shm: float) -> Optional[str]:
        """
        Creates a dispute on-chain by staking SHM.
        """
        if not self.contract_address:
            print("DAO contract not configured.")
            return None

        try:
            w3 = blockchain_service.w3
            contract = w3.eth.contract(address=self.contract_address, abi=self.abi)
            
            # Convert SHM to Wei
            amount_wei = w3.to_wei(amount_shm, 'ether')
            
            # Build transaction
            nonce = w3.eth.get_transaction_count(blockchain_service.account.address)
            tx = contract.functions.createDispute(
                url,
                verdict
            ).build_transaction({
                'chainId': blockchain_service.chain_id,
                'gas': 2500000,
                'gasPrice': w3.to_hex(w3.eth.gas_price),
                'nonce': nonce,
                'value': amount_wei
            })

            # Sign and Send
            signed_tx = w3.eth.account.sign_transaction(tx, blockchain_service.private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            return w3.to_hex(tx_hash)
        except Exception as e:
            print(f"Staking dispute failed: {e}")
            return None

dao_service = DAOService()
