from sqlalchemy.orm import Session

from app.db.models import Document, DocumentStatus


class DocumentRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(
        self,
        filename: str,
        stored_filename: str,
        status: str = DocumentStatus.QUEUED.value,
    ) -> Document:
        document = Document(filename=filename, stored_filename=stored_filename, status=status)
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def get(self, document_id: int) -> Document | None:
        return self.session.get(Document, document_id)

    def list_all(self) -> list[Document]:
        return self.session.query(Document).order_by(Document.created_at.desc()).all()
