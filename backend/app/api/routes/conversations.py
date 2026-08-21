import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.schemas import ChatRequest, ConversationCreate, ConversationOut, MessageOut
from app.db.deps import get_db
from app.repositories.conversations import ConversationRepository
from app.services.chat import ChatService, build_chat_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


def get_chat_service(db: Session = Depends(get_db)) -> ChatService:
    return build_chat_service(ConversationRepository(db))


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
def create_conversation(
    body: ConversationCreate,
    db: Session = Depends(get_db),
) -> ConversationOut:
    if not body.document_ids:
        raise HTTPException(status_code=400, detail="Selecione ao menos um documento.")
    conversation = ConversationRepository(db).create(body.document_ids, body.title)
    return ConversationOut.model_validate(conversation)


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)) -> list[ConversationOut]:
    conversations = ConversationRepository(db).list_all()
    return [ConversationOut.model_validate(item) for item in conversations]


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> list[MessageOut]:
    repository = ConversationRepository(db)
    if repository.get(conversation_id) is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    messages = repository.list_messages(conversation_id)
    return [MessageOut.model_validate(item) for item in messages]


@router.post("/{conversation_id}/chat")
def chat(
    conversation_id: int,
    body: ChatRequest,
    db: Session = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="A pergunta não pode ser vazia.")

    def event_stream():
        for event in service.stream_answer(conversation_id, body.question):
            payload = json.dumps(event.data, ensure_ascii=False)
            yield f"event: {event.kind}\ndata: {payload}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")