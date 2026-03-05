from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional


class UploadedFile(BaseModel):
    id: str
    user_id: str
    filename: str
    file_size_bytes: Optional[int]
    mime_type: Optional[str]
    openai_file_id: Optional[str]
    vector_store_id: Optional[str]
    status: Literal["pending", "processing", "completed", "failed"]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime


class UploadResponse(BaseModel):
    file: UploadedFile
    message: str
