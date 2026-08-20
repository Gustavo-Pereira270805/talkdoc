# 0005: Processamento assíncrono com BackgroundTasks (sem fila distribuída)

O processamento do documento (extração, chunking, embeddings, indexação) roda em `BackgroundTasks` do FastAPI, com o status persistido em `documents.status` e consultado por polling do front. Um broker de fila (Celery/Redis) seria infraestrutura real, mas é overkill para o escopo de 8h e um único usuário; o padrão de "submeter trabalho + consultar status" permanece idêntico se a fila for trocada depois.

## Considered Options

- Celery + Redis: distribuição real, porém mais serviços no compose e mais superfície de falha.
- Processamento síncrono no request: bloquearia o upload por segundos em PDFs grandes.

## Consequences

- Status visível no front durante todo o processamento; falhas reportadas como estado `failed` com motivo.