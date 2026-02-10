from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from app.db.session import banks

class BankRepository:
    
    @staticmethod
    def create(name: str, created_by: str) -> dict:
        """Create a new bank"""
        now = datetime.utcnow()
        doc = {
            "name": name,
            "created_by": ObjectId(created_by),
            "updated_by": ObjectId(created_by),
            "created_at": now,
            "updated_at": now
        }
        result = banks.insert_one(doc)
        return BankRepository.get_by_id(str(result.inserted_id))
    
    @staticmethod
    def get_by_id(bank_id: str) -> Optional[dict]:
        """Get bank by ID"""
        try:
            bank = banks.find_one({"_id": ObjectId(bank_id)})
            if bank:
                bank["id"] = str(bank["_id"])
                if "created_by" in bank:
                    bank["created_by"] = str(bank["created_by"])
                if "updated_by" in bank:
                    bank["updated_by"] = str(bank["updated_by"])
                del bank["_id"]
            return bank
        except:
            return None
    
    @staticmethod
    def get_all() -> List[dict]:
        """Get all banks"""
        result = []
        for bank in banks.find().sort("name", 1):
            bank["id"] = str(bank["_id"])
            if "created_by" in bank:
                bank["created_by"] = str(bank["created_by"])
            if "updated_by" in bank:
                bank["updated_by"] = str(bank["updated_by"])
            del bank["_id"]
            result.append(bank)
        return result
        
    @staticmethod
    def update(bank_id: str, name: str, updated_by: str) -> Optional[dict]:
        """Update bank name"""
        try:
            banks.update_one(
                {"_id": ObjectId(bank_id)},
                {"$set": {
                    "name": name,
                    "updated_by": ObjectId(updated_by),
                    "updated_at": datetime.utcnow()
                }}
            )
            return BankRepository.get_by_id(bank_id)
        except:
            return None
    
    @staticmethod
    def delete(bank_id: str) -> bool:
        """Delete a bank"""
        try:
            result = banks.delete_one({"_id": ObjectId(bank_id)})
            return result.deleted_count > 0
        except:
            return False
            
    @staticmethod
    def exists_by_name(name: str) -> bool:
        """Check if a bank name already exists (case insensitive)"""
        return banks.count_documents({"name": {"$regex": f"^{name}$", "$options": "i"}}) > 0
