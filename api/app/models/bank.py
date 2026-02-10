from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BankCreate(BaseModel):
    name: str = Field(..., max_length=255)

class BankResponse(BaseModel):
    id: str
    name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BankUpdate(BaseModel):
    name: str = Field(..., max_length=255)
