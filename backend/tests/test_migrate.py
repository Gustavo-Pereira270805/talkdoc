from sqlalchemy import create_engine, inspect

from scripts.migrate import run_migrations


def test_migrate_cria_schema_sqlite(tmp_path) -> None:
    db_path = tmp_path / "test.db"
    url = f"sqlite:///{db_path}"

    tables = run_migrations(url)

    assert db_path.exists()
    assert sorted(tables) == [
        "conversation_documents",
        "conversations",
        "documents",
        "messages",
    ]


def test_migrate_idempotente(tmp_path) -> None:
    url = f"sqlite:///{tmp_path / 'test.db'}"

    run_migrations(url)
    run_migrations(url)

    engine = create_engine(url)
    tables = inspect(engine).get_table_names()
    assert len(tables) == 4
