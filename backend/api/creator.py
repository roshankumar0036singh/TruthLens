from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.signature_service import signature_service

router = APIRouter()

class SignContentRequest(BaseModel):
    text: str
    author_id: str

class SignContentResponse(BaseModel):
    author_id: str
    signature_hash: str
    status: str

class VerifySignatureRequest(BaseModel):
    text: str
    author_id: str
    signature_hash: str

class VerifySignatureResponse(BaseModel):
    is_valid: bool
    status: str

@router.post("/sign", response_model=SignContentResponse)
async def sign_content(request: SignContentRequest):
    """
    Generates a cryptographically secure hash mapping the author to the content.
    Used for 'Proof of Integrity'.
    """
    content_hash = signature_service.generate_content_hash(request.text, request.author_id)
    # In production, this would also write the hash to Shardeum or IPFS via a smart contract.
    
    return {
        "author_id": request.author_id,
        "signature_hash": content_hash,
        "status": "success"
    }

@router.post("/verify-signature", response_model=VerifySignatureResponse)
async def verify_signature(request: VerifySignatureRequest):
    """
    Verifies if a given text exactly matches the content hash signed by the author.
    """
    is_valid = signature_service.verify_content_integrity(
        request.text, 
        request.author_id, 
        request.signature_hash
    )
    
    return {
        "is_valid": is_valid,
        "status": "Verified Match" if is_valid else "Integrity Failure - Content Altered"
    }

