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
