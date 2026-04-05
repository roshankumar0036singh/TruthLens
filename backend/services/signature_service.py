import hashlib
from typing import Dict, Any

class SignatureService:
    """
    Handles generation of cryptographic hashes for content ('Proof of Integrity').
    This allows creators to essentially 'sign' an article before publishing,
    and TruthLens can quickly verify if the text was altered after publication.
    """
    
    @staticmethod
    def generate_content_hash(text: str, author_id: str) -> str:
        """
        Creates a SHA-256 hash of the content combined with the author's ID.
        """
        payload = f"{text}|{author_id}".encode('utf-8')
        return hashlib.sha256(payload).hexdigest()
        
    @staticmethod
    def verify_content_integrity(text: str, author_id: str, provided_hash: str) -> bool:
        """
        Verifies if the provided text matches the original hash.
        """
        expected_hash = SignatureService.generate_content_hash(text, author_id)
        return expected_hash == provided_hash

# Global instance
signature_service = SignatureService()
