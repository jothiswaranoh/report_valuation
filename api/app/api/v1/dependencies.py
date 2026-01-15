from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.repositories.user_repo import UserRepository
from app.core.security import decode_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = UserRepository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_editor(current_user: dict = Depends(get_current_user)) -> dict:
    """Require editor or admin role"""
    roles = current_user.get("roles", [])
    if "admin" not in roles and "editor" not in roles:
        raise HTTPException(status_code=403, detail="Editor access required")
    return current_user
