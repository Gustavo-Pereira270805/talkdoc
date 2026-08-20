# 0001: Monorepo FastAPI + React/Vite orquestrado por Docker Compose

Escolhemos um monorepo com `backend/` (FastAPI, Pydantic v2, async) e `frontend/` (React + TypeScript + Vite), com Qdrant e banco SQLite orquestrados por `docker compose`. O ecossistema Python é o padrão da indústria para RAG e o backend do desafio; uma SPA com Vite mantém o chat simples e a separação de responsabilidades limpa, e Next.js não agrega valor a uma UI de chat sem SSR.

## Considered Options

- Next.js full-stack: mistura camadas e esconde o backend; sem ganho para o caso de uso.
- Node/Express para o backend: ecossistema RAG mais fraco que o Python.

## Consequences

- Reproduzível via `docker compose up` a partir de clone limpo; dois contextos de teste bem separados.