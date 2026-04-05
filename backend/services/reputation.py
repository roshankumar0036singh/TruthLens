import os
from eth_account import Account
from web3 import Web3
from typing import Optional
from .blockchain import blockchain_service

class ReputationService:
    """
    Handles minting of Soulbound Reputation Tokens (TLR) for community milestones.
    """
    def __init__(self):
        self.contract_address = os.getenv("REPUTATION_CONTRACT_ADDRESS")
        # Initialize with the deployed TLR contract ABI if available
        self.abi = [
            {
                "inputs": [
                    {"internalType": "address", "name": "to", "type": "address"},
                    {"internalType": "string", "name": "rank", "type": "string"},
                    {"internalType": "string", "name": "uri", "type": "string"}
                ],
                "name": "mintReputationBadge",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]

    async def reward_user(self, user_address: str, rank: str, metadata_uri: str) -> Optional[str]:
        """
        Mints an SBT badge to the user for a milestone.
        """
        if not self.contract_address:
            print("Reputation contract not configured.")
            return None

        try:
            # Re-use the existing blockchain service Web3 instance
            w3 = blockchain_service.w3
            contract = w3.eth.contract(address=self.contract_address, abi=self.abi)
            
            # Build transaction
            nonce = w3.eth.get_transaction_count(blockchain_service.account.address)
            tx = contract.functions.mintReputationBadge(
                Web3.to_checksum_address(user_address),
                rank,
                metadata_uri
            ).build_transaction({
                'chainId': blockchain_service.chain_id,
                'gas': 2000000,
                'gasPrice': w3.to_hex(w3.eth.gas_price),
                'nonce': nonce,
            })

            # Sign and Send
            signed_tx = w3.eth.account.sign_transaction(tx, blockchain_service.private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            return w3.to_hex(tx_hash)
        except Exception as e:
            print(f"Reputation minting failed: {e}")
            return None

reputation_service = ReputationService()
