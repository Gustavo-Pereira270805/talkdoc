from typing import Protocol

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.core.config import settings
from app.rag.chunker import Chunk


class IndexerClient(Protocol):
    def upsert_document(
        self, document_id: int, chunks: list[Chunk], vectors: list[list[float]]
    ) -> None: ...


class QdrantIndexer:
    def __init__(self, url: str, collection: str, dimension: int, timeout: int = 3):
        self.collection = collection
        self.dimension = dimension
        self.client = QdrantClient(url=url, timeout=timeout)

    def ensure_collection(self) -> None:
        if not self.client.collection_exists(self.collection):
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE),
            )

    def upsert_document(
        self, document_id: int, chunks: list[Chunk], vectors: list[list[float]]
    ) -> None:
        self.ensure_collection()
        points = [
            PointStruct(
                id=document_id * 100_000 + idx,
                vector=vector,
                payload={
                    "document_id": document_id,
                    "page": chunk.page,
                    "text": chunk.text,
                },
            )
            for idx, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True))
        ]
        self.client.upsert(collection_name=self.collection, points=points)

    def search(
        self,
        vector: list[float],
        document_id: int | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        self.ensure_collection()
        query_filter = None
        if document_id is not None:
            query_filter = Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            )
        results = self.client.query_points(
            collection_name=self.collection,
            query=vector,
            limit=top_k,
            query_filter=query_filter,
        )
        return [
            {
                "id": point.id,
                "score": point.score,
                "document_id": (point.payload or {})["document_id"],
                "page": (point.payload or {})["page"],
                "text": (point.payload or {})["text"],
            }
            for point in results.points
        ]


def build_indexer() -> QdrantIndexer:
    return QdrantIndexer(
        url=settings.qdrant_url,
        collection=settings.qdrant_collection,
        dimension=settings.embedding_dim,
        timeout=settings.qdrant_timeout,
    )
