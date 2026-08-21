from dataclasses import dataclass

from app.core.config import settings
from app.rag.embedder import EmbedderClient, build_embedder
from app.rag.indexer import IndexerClient, build_indexer


@dataclass
class RetrievedChunk:
    text: str
    page: int
    document_id: int
    filename: str
    score: float


class Retriever:
    def __init__(
        self,
        embedder: EmbedderClient,
        indexer: IndexerClient,
        top_k: int = 5,
        threshold: float = 0.3,
    ):
        self.embedder = embedder
        self.indexer = indexer
        self.top_k = top_k
        self.threshold = threshold

    def retrieve(self, query: str, document_ids: list[int]) -> list[RetrievedChunk]:
        vector = self.embedder.embed_query(query)
        results = self.indexer.search(vector, document_ids=document_ids, top_k=self.top_k)
        hits = [hit for hit in results if hit["score"] >= self.threshold]
        return [
            RetrievedChunk(
                text=hit["text"],
                page=hit["page"],
                document_id=hit["document_id"],
                filename=hit.get("filename", ""),
                score=hit["score"],
            )
            for hit in hits
        ]


def build_retriever() -> Retriever:
    return Retriever(
        embedder=build_embedder(),
        indexer=build_indexer(),
        top_k=settings.retrieval_top_k,
        threshold=settings.retrieval_threshold,
    )