from typing import Protocol

import httpx

from app.core.config import settings


class EmbedderClient(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


class GeminiEmbedder:
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    BATCH_SIZE = 100

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-embedding-001",
        dimension: int | None = None,
    ):
        self.api_key = api_key
        self.model = model
        self.dimension = dimension

    def _embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY não configurada.")
        requests = []
        for text in texts:
            request = {
                "model": f"models/{self.model}",
                "content": {"parts": [{"text": text}]},
                "taskType": task_type,
            }
            if self.dimension is not None:
                request["outputDimensionality"] = self.dimension
            requests.append(request)
        url = f"{self.BASE_URL}/models/{self.model}:batchEmbedContents"
        try:
            response = httpx.post(
                url,
                headers={"x-goog-api-key": self.api_key},
                json={"requests": requests},
                timeout=30,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Falha no provider de embeddings (status {exc.response.status_code}). "
                "Verifique a GEMINI_API_KEY."
            ) from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Falha de conexão com o provider de embeddings: {exc}") from exc
        data = response.json()
        return [item["values"] for item in data["embeddings"]]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), self.BATCH_SIZE):
            batch = texts[start : start + self.BATCH_SIZE]
            vectors.extend(self._embed(batch, "RETRIEVAL_DOCUMENT"))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        return self._embed([text], "RETRIEVAL_QUERY")[0]


def build_embedder() -> EmbedderClient:
    return GeminiEmbedder(
        api_key=settings.gemini_api_key,
        model=settings.embedding_model,
        dimension=settings.embedding_dim,
    )
