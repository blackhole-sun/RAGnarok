import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from supabase import Client
from app.dependencies import get_current_user, get_db
from app.models.chat import ChatRequest
from app.services.openai_service import stream_chat_response
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]

    # Verify thread ownership and get last_response_id
    thread_result = (
        db.table("threads")
        .select("id, last_response_id")
        .eq("id", body.thread_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not thread_result.data:
        raise HTTPException(status_code=404, detail="Thread not found")

    thread = thread_result.data[0]
    previous_response_id = thread.get("last_response_id")
    vector_store_id = settings.openai_vector_store_id

    async def event_generator():
        full_content = ""
        final_response_id = None

        for event_type, data in stream_chat_response(
            user_message=body.message,
            previous_response_id=previous_response_id,
            vector_store_id=vector_store_id,
        ):
            if event_type == "delta":
                full_content += data
                payload = json.dumps({"content": data})
                yield f"event: delta\ndata: {payload}\n\n"

            elif event_type == "done":
                final_response_id = data

                # Save user message
                db.table("messages").insert({
                    "thread_id": body.thread_id,
                    "user_id": user_id,
                    "role": "user",
                    "content": body.message,
                }).execute()

                # Save assistant message
                db.table("messages").insert({
                    "thread_id": body.thread_id,
                    "user_id": user_id,
                    "role": "assistant",
                    "content": full_content,
                }).execute()

                # Update thread last_response_id
                db.table("threads").update({
                    "last_response_id": final_response_id,
                }).eq("id", body.thread_id).execute()

                payload = json.dumps({"response_id": final_response_id})
                yield f"event: done\ndata: {payload}\n\n"

            elif event_type == "error":
                payload = json.dumps({"detail": data})
                yield f"event: error\ndata: {payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
