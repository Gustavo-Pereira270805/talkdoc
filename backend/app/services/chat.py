from collections.abc import Generator
from dataclasses import dataclass, field

from app.rag.llm import LLMClient, build_llm
from app.rag.prompts import build_context, build_system_prompt
from app.rag.retriever import Retriever, build_retriever
from app.repositories.conversations import ConversationRepository


@dataclass
class ChatEvent:
    kind: str  # references | token | done | error
    data: dict = field(default_factory=dict)


class ChatService:
    def __init__(
        self,
        repository: ConversationRepository,
        retriever: Retriever,
        llm: LLMClient,
    ):
        self.repository = repository
        self.retriever = retriever
        self.llm = llm

    def stream_answer(
        self, conversation_id: int, question: str
    ) -> Generator[ChatEvent, None, None]:
        conversation = self.repository.get(conversation_id)
        if conversation is None:
            yield ChatEvent("error", {"message": "Conversa não encontrada."})
            return

        document_ids = [document.id for document in conversation.documents]
        if not document_ids:
            yield ChatEvent("error", {"message": "Esta conversa não tem documentos."})
            return

        try:
            chunks = self.retriever.retrieve(question, document_ids)
            references = [
                {
                    "label": f"S{index}",
                    "text": chunk.text,
                    "page": chunk.page,
                    "document_id": chunk.document_id,
                    "filename": chunk.filename,
                }
                for index, chunk in enumerate(chunks, start=1)
            ]
            yield ChatEvent("references", {"references": references})

            context = build_context(chunks)
            messages = [
                {"role": "system", "content": build_system_prompt(context)},
                {"role": "user", "content": question},
            ]

            collected: list[str] = []
            for token in self.llm.stream_chat(messages):
                collected.append(token)
                yield ChatEvent("token", {"token": token})

            self.repository.add_message(conversation_id, "user", question)
            self.repository.add_message(
                conversation_id, "assistant", "".join(collected), references
            )
            yield ChatEvent("done")
        except Exception as exc:
            yield ChatEvent("error", {"message": str(exc)})


def build_chat_service(repository: ConversationRepository) -> ChatService:
    return ChatService(
        repository=repository,
        retriever=build_retriever(),
        llm=build_llm(),
    )