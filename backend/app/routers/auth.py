from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user.get("sub"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
    }
