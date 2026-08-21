from pathlib import Path

from app.core.config import settings
from app.db.models import DocumentStatus
from app.rag.chunker import chunk_document
from app.rag.embedder import EmbedderClient, build_embedder
from app.rag.extractor import extract_pages
from app.rag.indexer import IndexerClient, build_indexer
from app.repositories.documents import DocumentRepository


class ProcessingService:
    def __init__(
        self,
        repository: DocumentRepository,
        upload_dir: Path | None = None,
        embedder: EmbedderClient | None = None,
        indexer: IndexerClient | None = None,
    ):
        self.repository = repository
        self.upload_dir = upload_dir or Path(settings.upload_dir)
        self.embedder = embedder or build_embedder()
        self.indexer = indexer or build_indexer()

    def process(self, document_id: int) -> None:
        document = self.repository.get(document_id)
        if document is None:
            return

        try:
            document.status = DocumentStatus.EXTRACTING.value
            self.repository.session.commit()

            pdf_path = self.upload_dir / document.stored_filename
            pages = extract_pages(pdf_path)
            chunks = chunk_document(pages)

            document.page_count = len(pages)
            total_text = sum(len(page.text) for page in pages)

            if len(pages) == 0 or total_text == 0:
                document.status = DocumentStatus.FAILED.value
                document.error = (
                    "Não foi possível extrair texto do PDF "
                    "(pode ser um PDF escaneado, sem camada de texto)."
                )
            else:
                vectors = self.embedder.embed_documents([chunk.text for chunk in chunks])
                self.indexer.upsert_document(document.id, chunks, vectors, document.filename)
                document.status = DocumentStatus.READY.value
                document.error = None
            self.repository.session.commit()
        except Exception as exc:
            document.status = DocumentStatus.FAILED.value
            document.error = str(exc) or exc.__class__.__name__
            self.repository.session.commit()


def process_document(document_id: int) -> None:
    """Entrada do BackgroundTasks: abre sessão própria e processa o documento."""
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        ProcessingService(DocumentRepository(db)).process(document_id)
    finally:
        db.close()
