from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "TalkDoc API"
    database_url: str = "sqlite:///./data/talkdoc.db"
    qdrant_url: str = "http://qdrant:6333"
    cors_origins: str = "http://localhost:5173,http://localhost,http://localhost:8080"
    max_upload_size_mb: int = 20
    upload_dir: str = "uploads"
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    gemini_api_key: str = ""
    qdrant_collection: str = "chunks"
    embedding_model: str = "gemini-embedding-001"
    embedding_dim: int = 768
    qdrant_timeout: int = 3
    retrieval_top_k: int = 5
    retrieval_threshold: float = 0.3
    docs_enabled: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
