import jwt
from jwt import PyJWKClient
from typing import Optional
from fastapi import Header, HTTPException
from supabase import Client
from app.config import settings
from app.database import get_supabase

# Fetch Supabase public keys once and cache them (ES256 / HS256 auto-detected)
_jwks_client = PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256", "HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_db() -> Client:
    return get_supabase()
