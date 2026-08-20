"""Cria o schema SQLite. Idempotente. Usado pelo serviço `migrate` do compose."""

from sqlalchemy import create_engine, inspect

import app.db.models  # noqa: F401  # registra os modelos no metadata
from app.db.base import Base


def run_migrations(database_url: str) -> list[str]:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    Base.metadata.create_all(bind=engine)
    return inspect(engine).get_table_names()


if __name__ == "__main__":
    from app.core.config import settings

    tables = run_migrations(settings.database_url)
    print(f"Schema pronto. Tabelas: {', '.join(sorted(tables))}")
