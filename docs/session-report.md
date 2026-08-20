# Relatório de Sessão — TalkDoc (YAITEC)

Relatório incremental e sucinto da construção do projeto, focado em decisões de arquitetura, skills, frameworks, ferramentas, subagentes e processo. Atualizado a cada etapa relevante.

## Contexto

- **Desafio**: TalkDoc v2 (YAITEC Solutions) — app web de RAG sobre PDF.
- **Perfil**: AI Dev/Engineer e Fullstack (Estágio/Jr e Jr/Pleno).
- **Entrega**: repo privado GitHub, 48h, ~8h de esforço, colaboradores `ygorbalves` e `MateusNavarroR`.
- **Avaliado**: backend/API, frontend/UX, qualidade do RAG, reprodutibilidade, autoria/decisões, potencial.

## Decisões de processo

| Data | Decisão | Justificativa |
|---|---|---|
| 2026-08-20 | Skills do `mattpocock/skills` instaladas via `npx skills@latest` (8 skills em `.agents/skills/`) | Base de engenharia real ("not vibe coding"); composável, pequena, editável |
| 2026-08-20 | Issue tracker: GitHub Issues via `gh` | Entrega já é repo GitHub; tickets ficam visíveis no repo privado (demo de processo) |
| 2026-08-20 | Domain docs: single-context (`CONTEXT.md` + `docs/adr/`) | Repo pequeno, um único domínio |
| 2026-08-20 | `AGENTS.md` na raiz com bloco `## Agent skills` | Padrão universal de instruções para agentes (mattpocock, opencode) |
| 2026-08-20 | Setup por `/setup-matt-pocock-skills` (skill oficial do autor) | Configuração 1x por repo; seção B (triage labels) pulada — `triage` não instalada |

## Skills instaladas

- `grill-with-docs` — entrevista de planejamento que constrói `CONTEXT.md` + ADRs (escolhida como motor do planejamento)
- `wayfinder` — mapa de decision tickets para escopo grande (planejada; decidir uso após escopo)
- `to-spec` / `to-tickets` — converter conversa em spec → tickets tracer-bullet
- `grilling`, `domain-modeling`, `codebase-design` — primitivas model-invoked (dependências)
- `setup-matt-pocock-skills` — config do repo

## Decisões de arquitetura (via grilling — Round 1)

| # | Decisão | Justificativa |
|---|---|---|
| A1 | Monorepo: `backend/` FastAPI (Pydantic v2, async, pytest) + `frontend/` React+TS+Vite (Vitest+Testing Library) + `docker compose` | Ecossistema Python é padrão para RAG; SPA mais simples que Next.js para chat; separação limpa backend/frontend |
| A2 | RAG com **pipeline próprio** (sem LangChain/LlamaIndex/Agno), com abstração de provider | Demonstra domínio do conceito e facilita explicar tradeoffs na entrevista; frameworks escondem o pipeline |
| A3 | **Groq (Llama 3.3 70B)** para chat + **Gemini (text-embedding-004)** para embeddings | Ambos free tier; abstraídos atrás da interface de provider |
| A4 | **Qdrant** no docker compose | Vector store de produção; filtros por documento; setup trivial |
| A5 | **pytest** (backend: unit de chunking/retrieval/prompt + API) e **Vitest+Testing Library** (front: chat e estados de erro); fluxo red-green via `/tdd` | Testes demonstram rigor; TDD dá feedback loop consistente ao agente |

## Glossário

Criado `CONTEXT.md` com os termos do domínio: Documento, Processamento, Chunk, Índice, Recuperação, Referência, Conversa, Resposta fundamentada.

## Registro da sessão

- 14:54 — instaladas skills de planejamento (8).
- 14:56 — setup do repo: AGENTS.md, docs/agents/issue-tracker.md, docs/agents/domain.md.
- 15:03 — usuário adiciona `Desafio-Tecnico-TalkDoc-v2.md`; leitura do desafio e reinício da fronteira da árvore de design.