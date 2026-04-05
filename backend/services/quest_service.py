import os
import json
from hashlib import sha256
from .blockchain import blockchain_service

class QuestService:
    """
    Handles the creation and management of TruthQuests on-chain.
    """
    def __init__(self):
        self.contract_address = os.getenv("QUESTS_CONTRACT_ADDRESS")
        # TruthQuests ABI
        self.abi = [
            {
                "inputs": [
                    {"internalType": "bytes32", "name": "_claimId", "type": "bytes32"},
                    {"internalType": "string", "name": "_context", "type": "string"}
                ],
                "name": "createQuest",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "bytes32", "name": "_claimId", "type": "bytes32"}
                ],
                "name": "quests",
                "outputs": [
                    {"internalType": "bytes32", "name": "claimId", "type": "bytes32"},
                    {"internalType": "string", "name": "context", "type": "string"},
                    {"internalType": "uint256", "name": "bounty", "type": "uint256"},
                    {"internalType": "uint8", "name": "status", "type": "uint8"},
                    {"internalType": "address", "name": "resolver", "type": "address"},
                    {"internalType": "uint256", "name": "evidenceCount", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def _generate_claim_id(self, text: str) -> str:
        """Generates a unique bytes32 ID for a claim."""
        return "0x" + sha256(text.encode()).hexdigest()

    async def create_verification_quest(self, claim_text: str, context: str, bounty_amount_eth: float = 0.01):
        """
        Creates a new quest on-chain.
        """
        if not blockchain_service.private_key or not self.contract_address:
            print("QuestService: Config missing, skipping on-chain quest creation.")
            return None

        claim_id = self._generate_claim_id(claim_text)
        
        try:
            account = blockchain_service.w3.eth.account.from_key(blockchain_service.private_key)
            
            # Balance check before attempting Tx
            balance = blockchain_service.get_balance(account.address)
            if balance < 0.01:
                print(f"QuestService Warning: Insufficient funds ({balance} SHM). Skipping on-chain.")
                return None

            contract = blockchain_service.w3.eth.contract(address=self.contract_address, abi=self.abi)
            
            # Convert bounty to Wei
            bounty_wei = blockchain_service.w3.to_wei(bounty_amount_eth, 'ether')
            
            nonce = blockchain_service.w3.eth.get_transaction_count(account.address)
            tx = contract.functions.createQuest(
                blockchain_service.w3.to_bytes(hexstr=claim_id),
                context
            ).build_transaction({
                'from': account.address,
                'value': bounty_wei,
                'gas': 500000,
                'gasPrice': blockchain_service.w3.eth.gas_price,
                'nonce': nonce,
                'chainId': int(os.getenv("CHAIN_ID", 8119))
            })
            
            signed_tx = blockchain_service.w3.eth.account.sign_transaction(tx, private_key=blockchain_service.private_key)
            # Use raw_transaction (modern) or rawTransaction (legacy)
            raw_tx = getattr(signed_tx, 'raw_transaction', getattr(signed_tx, 'rawTransaction', None))
            tx_hash = blockchain_service.w3.eth.send_raw_transaction(raw_tx)
            
            print(f"Quest Created Successfully: {claim_id} | TX: {blockchain_service.w3.to_hex(tx_hash)}")
            
            # Save to local DB so it shows in Quest Hub
            await self.save_quest(
                title=f"Verify Trending: {claim_text[:20]}...",
                description=f"Sentinel detected high-impact claim on Shardeum Mezzame. Provide additional evidence to earn reputation. TX: {blockchain_service.w3.to_hex(tx_hash)[:10]}...",
                tx_hash=blockchain_service.w3.to_hex(tx_hash),
                claim_id_hex=claim_id
            )

            return blockchain_service.w3.to_hex(tx_hash)
            
        except Exception as e:
            if "insufficient funds" in str(e).lower():
                print("Quest Creation Error: Insufficient funds for transaction.")
            else:
                print(f"Quest Creation Error: {e}")
            return None

    async def save_quest(self, title: str, description: str, tx_hash: str, claim_id_hex: str = None):
        """
        Saves a quest to the local database for UI display.
        """
        from database import SessionLocal
        import models
        
        db = SessionLocal()
        try:
            new_quest = models.Quest(
                title=title,
                description=description,
                reward=f"Verifier Bounty ({tx_hash[:6]}...)",
                transaction_hash=tx_hash,
                status="active",
                progress=0
            )
            db.add(new_quest)
            await db.commit()
            await db.refresh(new_quest)
            return new_quest
        except Exception as e:
            print(f"Error saving quest to DB: {e}")
            return None
        finally:
            await db.close()

quest_service = QuestService()
