from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from supabase import Client
from app.dependencies import get_current_user, get_db
from app.models.ingestion import UploadedFile, UploadResponse
from app.services import ingestion_service

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    file_bytes = await file.read()
    mime_type = file.content_type or "application/octet-stream"
    filename = file.filename or "upload"
    file_size = len(file_bytes)

    try:
        row = ingestion_service.upload_file(
            file_bytes=file_bytes,
            filename=filename,
            mime_type=mime_type,
            file_size=file_size,
            user_id=user_id,
            db=db,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Poll for processing status in background
    background_tasks.add_task(
        ingestion_service.poll_file_status,
        db_file_id=row["id"],
        openai_file_id=row["openai_file_id"],
        vector_store_id=row["vector_store_id"],
        db=db,
    )

    return UploadResponse(file=UploadedFile(**row), message="File uploaded and processing")


@router.get("/files", response_model=list[UploadedFile])
async def list_files(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    return ingestion_service.list_files(user_id=user_id, db=db)


@router.delete("/files/{file_id}", status_code=204)
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = current_user["sub"]
    try:
        ingestion_service.delete_file(db_file_id=file_id, user_id=user_id, db=db)
    except ValueError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
