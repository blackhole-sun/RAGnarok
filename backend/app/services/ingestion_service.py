"""
Ingestion service: uploads files to OpenAI and attaches them to a vector store.
Polls OpenAI for processing status and updates the DB record.
"""
import asyncio
from openai import OpenAI
from supabase import Client
from app.config import settings

client = OpenAI(api_key=settings.openai_api_key)


def get_or_create_vector_store() -> str:
    """
    Returns the configured vector store ID.
    If OPENAI_VECTOR_STORE_ID is empty, creates a new vector store,
    prints the ID, and returns it. Set the ID in .env to reuse it.
    """
    vs_id = settings.openai_vector_store_id
    if vs_id:
        return vs_id

    # Create a new vector store
    vs = client.vector_stores.create(name="rangarok-rag")
    print(f"\n[SETUP] Created new OpenAI vector store: {vs.id}")
    print(f"[SETUP] Add this to backend/.env: OPENAI_VECTOR_STORE_ID={vs.id}\n")
    return vs.id


async def poll_file_status(
    db_file_id: str,
    openai_file_id: str,
    vector_store_id: str,
    db: Client,
) -> None:
    """Background task: poll OpenAI until the file is processed."""
    max_attempts = 24  # 2 minutes at 5s intervals
    delay = 5

    for _ in range(max_attempts):
        await asyncio.sleep(delay)
        try:
            vs_file = client.vector_stores.files.retrieve(
                vector_store_id=vector_store_id,
                file_id=openai_file_id,
            )
            if vs_file.status == "completed":
                db.table("uploaded_files").update({"status": "completed"}).eq("id", db_file_id).execute()
                return
            elif vs_file.status == "failed":
                error = str(vs_file.last_error) if vs_file.last_error else "Processing failed"
                db.table("uploaded_files").update({
                    "status": "failed",
                    "error_message": error,
                }).eq("id", db_file_id).execute()
                return
        except Exception as e:
            # Log but keep polling
            print(f"[ingestion] Poll error for {db_file_id}: {e}")

    # Timed out
    db.table("uploaded_files").update({
        "status": "failed",
        "error_message": "Processing timed out after 2 minutes",
    }).eq("id", db_file_id).execute()


def upload_file(
    file_bytes: bytes,
    filename: str,
    mime_type: str,
    file_size: int,
    user_id: str,
    db: Client,
) -> dict:
    """
    Uploads file to OpenAI, attaches to vector store, creates DB record.
    Returns the uploaded_files DB row.
    """
    vector_store_id = get_or_create_vector_store()

    # Upload to OpenAI Files API
    openai_file = client.files.create(
        file=(filename, file_bytes, mime_type),
        purpose="assistants",
    )

    # Create DB record
    row = db.table("uploaded_files").insert({
        "user_id": user_id,
        "filename": filename,
        "file_size_bytes": file_size,
        "mime_type": mime_type,
        "openai_file_id": openai_file.id,
        "vector_store_id": vector_store_id,
        "status": "processing",
    }).execute().data[0]

    # Attach file to vector store
    client.vector_stores.files.create(
        vector_store_id=vector_store_id,
        file_id=openai_file.id,
    )

    return row


def list_files(user_id: str, db: Client) -> list[dict]:
    result = (
        db.table("uploaded_files")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def delete_file(db_file_id: str, user_id: str, db: Client) -> None:
    """Deletes file from OpenAI and removes the DB record."""
    row = (
        db.table("uploaded_files")
        .select("openai_file_id, vector_store_id")
        .eq("id", db_file_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not row.data:
        raise ValueError("File not found")

    file_data = row.data[0]
    openai_file_id = file_data.get("openai_file_id")
    vector_store_id = file_data.get("vector_store_id")

    # Remove from vector store
    if openai_file_id and vector_store_id:
        try:
            client.vector_stores.files.delete(
                vector_store_id=vector_store_id,
                file_id=openai_file_id,
            )
        except Exception as e:
            print(f"[ingestion] Failed to remove from vector store: {e}")

    # Delete from OpenAI files
    if openai_file_id:
        try:
            client.files.delete(openai_file_id)
        except Exception as e:
            print(f"[ingestion] Failed to delete OpenAI file: {e}")

    # Delete DB record
    db.table("uploaded_files").delete().eq("id", db_file_id).eq("user_id", user_id).execute()
