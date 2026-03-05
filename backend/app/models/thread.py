from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Thread(BaseModel):
    id: str
    user_id: str
    title: str
    last_response_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class CreateThreadRequest(BaseModel):
    title: str = "New Chat"


class UpdateThreadRequest(BaseModel):
    title: str
