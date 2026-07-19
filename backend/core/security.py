import hmac
import hashlib
import json
import base64
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings

security = HTTPBearer()

# Use Supabase JWT secret or a fallback to sign custom tokens
SECRET_KEY = settings.SUPABASE_JWT_SECRET.encode("utf-8")

def sign_token(payload: dict) -> str:
    """Helper to sign user claims into a secure bearer token using HMAC-SHA256."""
    payload_json = json.dumps(payload).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("utf-8")
    signature = hmac.new(SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verifies a custom signed bearer token and returns the payload claims."""
    token = credentials.credentials
    if not token or "." not in token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed authorization token."
        )
    
    try:
        payload_b64, signature = token.split(".", 1)
        expected_sig = hmac.new(SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization signature."
            )
            
        payload_json = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
        payload = json.loads(payload_json)
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )

def require_role(allowed_roles: list[str]):
    """Returns a dependency checker that restricts access to specific roles."""
    def role_dependency(payload: dict = Depends(verify_token)) -> dict:
        user_role = payload.get("role")
        if not user_role or user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}."
            )
        return payload
    return role_dependency
