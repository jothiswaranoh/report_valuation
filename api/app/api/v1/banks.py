from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.bank import BankCreate, BankResponse, BankUpdate
from app.repositories.bank_repo import BankRepository
from app.api.v1.dependencies import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Banks"])

@router.get("/banks", response_model=List[BankResponse])
async def get_banks(current_user: dict = Depends(get_current_user)):
    """Get all banks"""
    return BankRepository.get_all()

@router.post("/banks", response_model=BankResponse)
async def create_bank(
    payload: BankCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new bank"""
    # Check if admin
    if "admin" not in current_user.get("roles", []):
         raise HTTPException(status_code=403, detail="Access denied. Admin only.")

    if BankRepository.exists_by_name(payload.name):
        raise HTTPException(status_code=400, detail="Bank with this name already exists")
        
    bank = BankRepository.create(payload.name, current_user["id"])
    if not bank:
        raise HTTPException(status_code=500, detail="Failed to create bank")
        
    return bank

@router.put("/banks/{bank_id}", response_model=BankResponse)
async def update_bank(
    bank_id: str,
    payload: BankUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a bank"""
    # Check if admin
    if "admin" not in current_user.get("roles", []):
         raise HTTPException(status_code=403, detail="Access denied. Admin only.")
         
    bank = BankRepository.get_by_id(bank_id)
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
        
    updated_bank = BankRepository.update(bank_id, payload.name, current_user["id"])
    if not updated_bank:
        raise HTTPException(status_code=500, detail="Failed to update bank")
        
    return updated_bank

@router.delete("/banks/{bank_id}")
async def delete_bank(
    bank_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a bank"""
    # Check if admin
    if "admin" not in current_user.get("roles", []):
         raise HTTPException(status_code=403, detail="Access denied. Admin only.")
         
    success = BankRepository.delete(bank_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bank not found or failed to delete")
        
    return {"success": True, "message": "Bank deleted successfully"}
