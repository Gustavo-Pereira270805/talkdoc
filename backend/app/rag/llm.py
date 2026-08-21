import json
from collections.abc import Generator
from typing import Protocol

import httpx

from app.core.config import settings


class LLMClient(Protocol):
    def stream_chat(
        self, messages: list[dict[str, str]], temperature: float = 0.2
    ) -> Generator[str, None, None]: ...


class GroqLLM:
    BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model = model

    def stream_chat(
        self, messages: list[dict[str, str]], temperature: float = 0.2
    ) -> Generator[str, None, None]:
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY não configurada.")
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "temperature": temperature,
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            with httpx.stream(
                "POST", self.BASE_URL, headers=headers, json=payload, timeout=60
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data = line.removeprefix("data: ").strip()
                    if data == "[DONE]":
                        break
                    delta = json.loads(data)["choices"][0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Falha no provider de chat (status {exc.response.status_code}). "
                "Verifique a GROQ_API_KEY."
            ) from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Falha de conexão com o provider de chat: {exc}") from exc


def build_llm() -> LLMClient:
    return GroqLLM(api_key=settings.groq_api_key, model=settings.groq_model)