import io
import json

import pymupdf
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes import documents as documents_route
from app.api.routes.conversations import get_chat_service
from app.db.base import Base
from app.db.deps import get_db
from app.main import app
from app.rag.retriever import RetrievedChunk
from app.repositories.conversations import ConversationRepository
from app.services.chat import ChatService
from app.services.upload import UploadService, get_upload_service


class FakeRetriever:
    def __init__(self):
        self.chunks: list[dict] = []
        self.fail = False
        self.calls: list[tuple[str, list[int]]] = []

    def retrieve(self, query: str, document_ids: list[int]) -> list[RetrievedChunk]:
        self.calls.append((query, document_ids))
        if self.fail:
            raise RuntimeError("falha na recuperação")
        return [RetrievedChunk(**chunk) for chunk in self.chunks]


class FakeLLM:
    def __init__(self):
        self.tokens: tuple[str, ...] = ()
        self.fail = False
        self.last_messages: list[dict[str, str]] = []

    def stream_chat(self, messages, temperature: float = 0.2):
        self.last_messages = messages
        if self.fail:
            raise RuntimeError("provedor de chat fora do ar")
        yield from self.tokens


@pytest.fixture()
def chat_ctx(tmp_path, monkeypatch):
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

    state = {"retriever": FakeRetriever(), "llm": FakeLLM()}

    def override_chat_service() -> ChatService:
        db = session_factory()
        return ChatService(
            ConversationRepository(db), state["retriever"], state["llm"]
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_upload_service] = override_upload_service
    app.dependency_overrides[get_chat_service] = override_chat_service
    with TestClient(app) as client:
        yield client, state
    app.dependency_overrides.clear()


def _pdf_bytes(text: str) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def _upload_doc(client, filename: str) -> int:
    response = client.post(
        "/documents",
        files={"file": (filename, _pdf_bytes(f"conteudo de {filename}"), "application/pdf")},
    )
    return response.json()["id"]


def _conversation(client, document_ids: list[int]) -> int:
    response = client.post("/conversations", json={"document_ids": document_ids})
    return response.json()["id"]


def _parse_sse(text: str) -> list[tuple[str, dict]]:
    events: list[tuple[str, dict]] = []
    for block in text.strip().split("\n\n"):
        event_kind = None
        data: dict = {}
        for line in block.splitlines():
            if line.startswith("event: "):
                event_kind = line.removeprefix("event: ")
            elif line.startswith("data: "):
                data = json.loads(line.removeprefix("data: "))
        if event_kind:
            events.append((event_kind, data))
    return events


def test_cria_conversa_com_titulo_do_primeiro_documento(chat_ctx) -> None:
    client, _ = chat_ctx
    first = _upload_doc(client, "primeiro.pdf")
    second = _upload_doc(client, "segundo.pdf")

    response = client.post("/conversations", json={"document_ids": [first, second]})

    assert response.status_code == 201
    assert response.json()["title"] == "primeiro.pdf"


def test_conversa_sem_documentos_422(chat_ctx) -> None:
    client, _ = chat_ctx
    response = client.post("/conversations", json={"document_ids": []})
    assert response.status_code == 422


def test_chat_fluxo_completo_ssa(chat_ctx) -> None:
    client, state = chat_ctx
    doc_id = _upload_doc(client, "doc.pdf")
    state["retriever"].chunks = [
        {
            "text": "trecho relevante",
            "page": 2,
            "document_id": doc_id,
            "filename": "doc.pdf",
            "score": 0.9,
        }
    ]
    state["llm"].tokens = ("Resposta ", "fundamentada")
    conversation_id = _conversation(client, [doc_id])

    response = client.post(
        f"/conversations/{conversation_id}/chat", json={"question": "O que diz o documento?"}
    )

    assert response.status_code == 200
    events = _parse_sse(response.text)
    kinds = [event[0] for event in events]
    assert kinds[0] == "references"
    assert kinds[-1] == "done"

    references = events[0][1]["references"]
    assert references[0]["label"] == "S1"
    assert references[0]["page"] == 2
    assert references[0]["filename"] == "doc.pdf"

    answer = "".join(event[1]["token"] for event in events if event[0] == "token")
    assert answer == "Resposta fundamentada"
    assert state["retriever"].calls[0][1] == [doc_id]
    assert state["llm"].last_messages[0]["role"] == "system"
    assert "Contexto:" in state["llm"].last_messages[0]["content"]

    messages = client.get(f"/conversations/{conversation_id}/messages").json()
    assert [message["role"] for message in messages] == ["user", "assistant"]
    assert messages[1]["refs"][0]["label"] == "S1"


def test_chat_sem_trechos_relevantes_chama_llm(chat_ctx) -> None:
    client, state = chat_ctx
    doc_id = _upload_doc(client, "doc.pdf")
    state["retriever"].chunks = []
    state["llm"].tokens = ("Não encontrei",)
    conversation_id = _conversation(client, [doc_id])

    response = client.post(
        f"/conversations/{conversation_id}/chat", json={"question": "pergunta fora do doc"}
    )

    events = _parse_sse(response.text)
    assert events[0][0] == "references"
    assert events[0][1]["references"] == []
    answer = "".join(event[1]["token"] for event in events if event[0] == "token")
    assert "Não encontrei" in answer


def test_chat_erro_provedor_vira_evento_error(chat_ctx) -> None:
    client, state = chat_ctx
    doc_id = _upload_doc(client, "doc.pdf")
    state["llm"].fail = True
    conversation_id = _conversation(client, [doc_id])

    response = client.post(
        f"/conversations/{conversation_id}/chat", json={"question": "pergunta"}
    )

    events = _parse_sse(response.text)
    assert events[-1][0] == "error"
    assert "fora do ar" in events[-1][1]["message"]


def test_chat_pergunta_vazia_400(chat_ctx) -> None:
    client, _ = chat_ctx
    doc_id = _upload_doc(client, "doc.pdf")
    conversation_id = _conversation(client, [doc_id])

    response = client.post(
        f"/conversations/{conversation_id}/chat", json={"question": "   "}
    )
    assert response.status_code == 400


def test_chat_pergunta_gigante_422(chat_ctx) -> None:
    client, _ = chat_ctx
    doc_id = _upload_doc(client, "doc.pdf")
    conversation_id = _conversation(client, [doc_id])

    response = client.post(
        f"/conversations/{conversation_id}/chat", json={"question": "a" * 5000}
    )
    assert response.status_code == 422


def test_conversa_titulo_gigante_422(chat_ctx) -> None:
    client, _ = chat_ctx
    doc_id = _upload_doc(client, "doc.pdf")

    response = client.post(
        "/conversations", json={"document_ids": [doc_id], "title": "t" * 1000}
    )
    assert response.status_code == 422


def test_messages_conversa_inexistente_404(chat_ctx) -> None:
    client, _ = chat_ctx
    assert client.get("/conversations/999/messages").status_code == 404