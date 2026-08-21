from sqlalchemy.orm import Session

from app.db.models import Conversation, Document, Message


class ConversationRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, document_ids: list[int], title: str | None = None) -> Conversation:
        documents = (
            self.session.query(Document).filter(Document.id.in_(document_ids)).all()
        )
        default_title = documents[0].filename if documents else "Nova conversa"
        conversation = Conversation(title=title or default_title)
        conversation.documents = documents
        self.session.add(conversation)
        self.session.commit()
        self.session.refresh(conversation)
        return conversation

    def get(self, conversation_id: int) -> Conversation | None:
        return self.session.get(Conversation, conversation_id)

    def list_all(self) -> list[Conversation]:
        return self.session.query(Conversation).order_by(Conversation.created_at.desc()).all()

    def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        refs: list[dict] | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            refs=refs,
        )
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def list_messages(self, conversation_id: int) -> list[Message]:
        return (
            self.session.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )