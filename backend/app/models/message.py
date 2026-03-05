from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class Message(BaseModel):
    id: str
    thread_id: str
    user_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class CreateMessageRequest(BaseModel):
    thread_id: str
    role: Literal["user", "assistant"]
    content: str
