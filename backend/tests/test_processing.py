import io

import pymupdf
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes import documents as documents_route
from app.db.base import Base
from app.db.deps import get_db
from app.main import app
from app.repositories.documents import DocumentRepository
from app.services.processing import ProcessingService
from app.services.upload import UploadService, get_upload_service


class FakeEmbedder:
    def __init__(self, dimension: int = 8, fail: bool = False):
        self.dimension = dimension
        self.fail = fail
        self.called_texts: list[str] = []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if self.fail:
            raise RuntimeError("provedor de embedding fora do ar")
        self.called_texts.extend(texts)
        return [[0.1] * self.dimension for _ in texts]


class FakeIndexer:
    def __init__(self):
        self.upserts: dict[int, list[tuple[str, int]]] = {}

    def upsert_document(self, document_id: int, chunks, vectors, filename: str) -> None:
        self.upserts[document_id] = [(chunk.text, chunk.page) for chunk in chunks]


@pytest.fixture()
def processing_ctx(tmp_path, monkeypatch):
    # O background real de processamento é validado no Docker; em pytest ele
    # atacaria o SessionLocal (:memory: do conftest) sem schema.
    monkeypatch.setattr(documents_route, "process_document", lambda document_id: None)

    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    upload_dir = tmp_path / "uploads"

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    def override_upload_service() -> UploadService:
        return UploadService(upload_dir=upload_dir, max_upload_size=20 * 1024 * 1024)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_upload_service] = override_upload_service
    with TestClient(app) as client:
        yield client, session_factory, upload_dir
    app.dependency_overrides.clear()


def _pdf_bytes(text: str, words_per_line: int = 12) -> bytes:
    words = text.split()
    doc = pymupdf.open()
    page = doc.new_page()
    y = 72
    for start in range(0, len(words), words_per_line):
        line = " ".join(words[start : start + words_per_line])
        page.insert_text((72, y), line)
        y += 14
        if y > 760:
            page = doc.new_page()
            y = 72
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def _blank_pdf_bytes() -> bytes:
    doc = pymupdf.open()
    doc.new_page()
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def _process(
    client, session_factory, upload_dir, document_id, embedder=None, indexer=None
) -> None:
    db = session_factory()
    try:
        ProcessingService(
            DocumentRepository(db),
            upload_dir=upload_dir,
            embedder=embedder or FakeEmbedder(),
            indexer=indexer or FakeIndexer(),
        ).process(document_id)
    finally:
        db.close()


def test_processo_avanca_para_ready(processing_ctx) -> None:
    client, session_factory, upload_dir = processing_ctx
    long_text = " ".join(f"palavra_{i}" for i in range(500))
    response = client.post(
        "/documents",
        files={"file": ("doc.pdf", _pdf_bytes(long_text), "application/pdf")},
    )
    document_id = response.json()["id"]

    _process(client, session_factory, upload_dir, document_id)

    detail = client.get(f"/documents/{document_id}").json()
    assert detail["status"] == "ready"
    assert detail["page_count"] == 1
    assert detail["error"] is None


def test_processo_multi_pagina_grava_page_count(processing_ctx) -> None:
    client, session_factory, upload_dir = processing_ctx
    doc = pymupdf.open()
    doc.new_page()
    doc.new_page()
    for page in doc:
        page.insert_text((72, 72), "texto da pagina")
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    response = client.post(
        "/documents",
        files={"file": ("duas.pdf", buf.getvalue(), "application/pdf")},
    )
    document_id = response.json()["id"]

    _process(client, session_factory, upload_dir, document_id)

    detail = client.get(f"/documents/{document_id}").json()
    assert detail["status"] == "ready"
    assert detail["page_count"] == 2


def test_processo_pdf_escaneado_falha_com_motivo(processing_ctx) -> None:
    client, session_factory, upload_dir = processing_ctx
    response = client.post(
        "/documents",
        files={"file": ("scan.pdf", _blank_pdf_bytes(), "application/pdf")},
    )
    document_id = response.json()["id"]

    _process(client, session_factory, upload_dir, document_id)

    detail = client.get(f"/documents/{document_id}").json()
    assert detail["status"] == "failed"
    assert "escaneado" in detail["error"]


def test_get_document_inexistente_404(processing_ctx) -> None:
    client, _, _ = processing_ctx
    assert client.get("/documents/999").status_code == 404


def test_lista_documentos(processing_ctx) -> None:
    client, _, _ = processing_ctx
    client.post(
        "/documents",
        files={"file": ("a.pdf", _pdf_bytes("conteudo a"), "application/pdf")},
    )
    client.post(
        "/documents",
        files={"file": ("b.pdf", _pdf_bytes("conteudo b"), "application/pdf")},
    )
    documents = client.get("/documents").json()
    assert len(documents) == 2
    assert {doc["filename"] for doc in documents} == {"a.pdf", "b.pdf"}


def test_processo_indexa_chunks_no_embedder(processing_ctx) -> None:
    client, session_factory, upload_dir = processing_ctx
    embedder = FakeEmbedder()
    indexer = FakeIndexer()
    long_text = " ".join(f"palavra_{i}" for i in range(2000))
    response = client.post(
        "/documents",
        files={"file": ("doc.pdf", _pdf_bytes(long_text), "application/pdf")},
    )
    document_id = response.json()["id"]

    _process(client, session_factory, upload_dir, document_id, embedder, indexer)

    upserted = indexer.upserts[document_id]
    assert len(upserted) >= 2  # 2000 palavras -> varios chunks
    assert len(embedder.called_texts) == len(upserted)
    assert all(isinstance(text, str) and text for text in embedder.called_texts)
    assert all(isinstance(text, str) and page >= 1 for text, page in upserted)


def test_processo_falha_no_embedder_marco_failed(processing_ctx) -> None:
    client, session_factory, upload_dir = processing_ctx
    response = client.post(
        "/documents",
        files={"file": ("doc.pdf", _pdf_bytes("texto valido"), "application/pdf")},
    )
    document_id = response.json()["id"]

    _process(client, session_factory, upload_dir, document_id, FakeEmbedder(fail=True))

    detail = client.get(f"/documents/{document_id}").json()
    assert detail["status"] == "failed"
    assert "provedor de embedding" in detail["error"]
