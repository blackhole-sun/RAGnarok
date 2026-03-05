from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_current_user, get_db
from app.models.message import Message

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("/{thread_id}", response_model=list[Message])
async def list_messages(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]

    # Verify thread ownership
    thread = (
        db.table("threads")
        .select("id")
        .eq("id", thread_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")

    result = (
        db.table("messages")
        .select("*")
        .eq("thread_id", thread_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data
