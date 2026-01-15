"""
User and Role models based on DocSpec schema
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ----------------------
# Request/Response Models
# ----------------------

class UserCreate(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    password: str
    role: str = "viewer"  # Default role


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    roles: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ----------------------
# Role Models
# ----------------------

class RoleCreate(BaseModel):
    name: str = Field(..., max_length=50)


class RoleResponse(BaseModel):
    id: str
    name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------------
# User Role Assignment
# ----------------------

class UserRoleAssign(BaseModel):
    user_id: str
    role_id: str
