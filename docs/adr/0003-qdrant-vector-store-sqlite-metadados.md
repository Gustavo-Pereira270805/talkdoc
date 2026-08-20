# 0003: Qdrant como vector store; SQLite para metadados da aplicação

Os vetores e a recuperação top-k vivem no Qdrant (coleção com `document_id` e `page` como payload, permitindo filtros por documento); conversas, mensagens e registros de documentos vivem em SQLite via SQLAlchemy 2. Qdrant é vector store de produção com filtros nativos e sobe em um serviço do compose; o SQLite guarda apenas metadados de carga trivial, então um Postgres só adicionaria peças móveis sem benefício no escopo do desafio.

## Considered Options

- pgvector: exigiria Postgres e reduziria a clareza do filtro por documento.
- Chroma: mais simples, porém menos real-world e com menos controle do índice.
- FAISS em memória: sem persistência e sem filtros por documento.

## Consequences

- Um serviço a mais no compose, mas com healthcheck trivial; dados da aplicação sobrevivem a restarts.