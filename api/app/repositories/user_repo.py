"""
User repository - database operations for users
"""

from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from app.db.session import db, users, roles, user_roles
from app.core.security import hash_password, verify_password


class UserRepository:
    
    @staticmethod
    def get_by_id(user_id: str) -> Optional[dict]:
        """Get user by ID"""
        try:
            user = users.find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user["_id"])
                user["roles"] = UserRepository.get_user_roles(user_id)
            return user
        except:
            return None
    
    @staticmethod
    def get_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        user = users.find_one({"email": email})
        if user:
            user["id"] = str(user["_id"])
            user["roles"] = UserRepository.get_user_roles(str(user["_id"]))
        return user
    
    @staticmethod
    def get_all() -> List[dict]:
        """Get all users"""
        result = []
        for user in users.find({}, {"password": 0}):
            user["id"] = str(user["_id"])
            user["roles"] = UserRepository.get_user_roles(str(user["_id"]))
            result.append(user)
        return result
    
    @staticmethod
    def create(first_name: str, last_name: str, email: str, password: str, 
               role_name: str = "viewer", created_by: str = None) -> dict:
        """Create a new user"""
        # Check if email exists
        if users.find_one({"email": email}):
            raise ValueError("Email already exists")
        
        # Get role
        role = roles.find_one({"name": role_name})
        if not role:
            raise ValueError(f"Role '{role_name}' not found")
        
        # Create user
        hashed_pwd = hash_password(password)
        now = datetime.utcnow()
        
        user_doc = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": hashed_pwd,
            "created_by": ObjectId(created_by) if created_by else None,
            "updated_by": ObjectId(created_by) if created_by else None,
            "created_at": now,
            "updated_at": now
        }
        
        result = users.insert_one(user_doc)
        user_id = result.inserted_id
        
        # Assign role
        user_roles.insert_one({
            "user_id": user_id,
            "role_id": role["_id"],
            "created_at": now
        })
        
        return UserRepository.get_by_id(str(user_id))
    
    @staticmethod
    def update(user_id: str, updated_by: str = None, **kwargs) -> Optional[dict]:
        """Update user"""
        update_data = {"updated_at": datetime.utcnow()}
        if updated_by:
            update_data["updated_by"] = ObjectId(updated_by)
        
        if "first_name" in kwargs and kwargs["first_name"]:
            update_data["first_name"] = kwargs["first_name"]
        if "last_name" in kwargs and kwargs["last_name"]:
            update_data["last_name"] = kwargs["last_name"]
        if "email" in kwargs and kwargs["email"]:
            update_data["email"] = kwargs["email"]
        if "password" in kwargs and kwargs["password"]:
            update_data["password"] = hash_password(kwargs["password"])
        
        users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Update role if provided
        if "role" in kwargs and kwargs["role"]:
            role = roles.find_one({"name": kwargs["role"]})
            if role:
                # Remove existing roles
                user_roles.delete_many({"user_id": ObjectId(user_id)})
                # Add new role
                user_roles.insert_one({
                    "user_id": ObjectId(user_id),
                    "role_id": role["_id"],
                    "created_at": datetime.utcnow()
                })
        
        return UserRepository.get_by_id(user_id)
    
    @staticmethod
    def delete(user_id: str) -> bool:
        """Delete user"""
        # Delete user roles first
        user_roles.delete_many({"user_id": ObjectId(user_id)})
        # Delete user
        result = users.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def get_user_roles(user_id: str) -> List[str]:
        """Get roles for a user"""
        role_names = []
        for ur in user_roles.find({"user_id": ObjectId(user_id)}):
            role = roles.find_one({"_id": ur["role_id"]})
            if role:
                role_names.append(role["name"])
        return role_names
    
    @staticmethod
    def authenticate(email: str, password: str) -> Optional[dict]:
        """Authenticate user by email and password"""
        user = users.find_one({"email": email})
        if not user:
            return None
        
        if not verify_password(password, user["password"]):
            return None
        
        user["id"] = str(user["_id"])
        user["roles"] = UserRepository.get_user_roles(str(user["_id"]))
        return user
