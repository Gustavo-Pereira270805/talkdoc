from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: str


class DocumentDetailOut(DocumentOut):
    page_count: int | None = None
    error: str | None = None


class ConversationCreate(BaseModel):
    document_ids: list[int] = Field(min_length=1, max_length=50)
    title: str | None = Field(default=None, max_length=200)


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    refs: list[dict] | None
    created_at: datetime


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
