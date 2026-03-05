from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_current_user, get_db
from app.models.thread import Thread, CreateThreadRequest, UpdateThreadRequest

router = APIRouter(prefix="/api/threads", tags=["threads"])


@router.get("", response_model=list[Thread])
async def list_threads(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    result = (
        db.table("threads")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


@router.post("", response_model=Thread, status_code=201)
async def create_thread(
    body: CreateThreadRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    result = (
        db.table("threads")
        .insert({"user_id": user_id, "title": body.title})
        .execute()
    )
    return result.data[0]


@router.patch("/{thread_id}", response_model=Thread)
async def update_thread(
    thread_id: str,
    body: UpdateThreadRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    result = (
        db.table("threads")
        .update({"title": body.title})
        .eq("id", thread_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Thread not found")
    return result.data[0]


@router.delete("/{thread_id}", status_code=204)
async def delete_thread(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    result = (
        db.table("threads")
        .delete()
        .eq("id", thread_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Thread not found")
