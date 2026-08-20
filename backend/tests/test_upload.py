import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes import documents as documents_route
from app.db.base import Base
from app.db.deps import get_db
from app.main import app
from app.services.upload import UploadService, get_upload_service


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # O background real de processamento é validado no Docker; em pytest ele
    # atacaria o SessionLocal (:memory: do conftest) sem schema.
    monkeypatch.setattr(documents_route, "process_document", lambda document_id: None)

    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    upload_dir = tmp_path / "uploads"

    def override_get_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    def override_upload_service() -> UploadService:
        return UploadService(upload_dir=upload_dir, max_upload_size=20 * 1024 * 1024)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_upload_service] = override_upload_service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _pdf_bytes() -> bytes:
    return b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"


def test_upload_pdf_valido_retorna_202(client, tmp_path) -> None:
    response = client.post(
        "/documents",
        files={"file": ("relatorio.pdf", _pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["filename"] == "relatorio.pdf"
    assert data["status"] == "queued"
    assert isinstance(data["id"], int)
    assert len(list((tmp_path / "uploads").glob("*.pdf"))) == 1


def test_rejeita_arquivo_nao_pdf(client) -> None:
    response = client.post(
        "/documents",
        files={"file": ("texto.txt", b"isto nao e um pdf", "text/plain")},
    )
    assert response.status_code == 415
    assert "PDF" in response.json()["detail"]


def test_rejeita_arquivo_maior_que_20mb(client) -> None:
    big = b"%PDF" + b"x" * (20 * 1024 * 1024)
    response = client.post(
        "/documents",
        files={"file": ("grande.pdf", big, "application/pdf")},
    )
    assert response.status_code == 413
    assert "20MB" in response.json()["detail"]


def test_sanitiza_nome_do_arquivo(client) -> None:
    response = client.post(
        "/documents",
        files={"file": ("../../café relatório!.pdf", _pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 202
    assert response.json()["filename"] == "cafe_relatorio.pdf"


def test_rejeita_arquivo_vazio(client) -> None:
    response = client.post(
        "/documents",
        files={"file": ("vazio.pdf", b"", "application/pdf")},
    )
    assert response.status_code == 400
