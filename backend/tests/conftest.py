import os

import pytest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["QDRANT_URL"] = "http://127.0.0.1:1"


@pytest.fixture(autouse=True)
def _no_qdrant_boot(monkeypatch):
    """Evita conexão real ao Qdrant no lifespan do app durante os testes."""

    class _NoopIndexer:
        def ensure_collection(self) -> None:
            return None

    monkeypatch.setattr("app.main.build_indexer", lambda: _NoopIndexer())
