from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: str


class DocumentDetailOut(DocumentOut):
    page_count: int | None = None
    error: str | None = None
