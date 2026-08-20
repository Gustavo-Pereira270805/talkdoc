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

## Decisões de arquitetura (via grilling — Rounds 1–4)

| # | Decisão | Justificativa |
|---|---|---|
| A1 | Monorepo: `backend/` FastAPI (Pydantic v2, async, pytest) + `frontend/` React+TS+Vite (Vitest+Testing Library) + `docker compose` | Ecossistema Python é padrão para RAG; SPA mais simples que Next.js para chat; separação limpa backend/frontend |
| A2 | RAG com **pipeline próprio** (sem LangChain/LlamaIndex/Agno), com abstração de provider | Demonstra domínio do conceito e facilita explicar tradeoffs na entrevista; frameworks escondem o pipeline |
| A3 | **Groq (Llama 3.3 70B)** para chat + **Gemini (text-embedding-004)** para embeddings | Ambos free tier; abstraídos atrás da interface de provider |
| A4 | **Qdrant** no docker compose | Vector store de produção; filtros por documento; setup trivial |
| A5 | **pytest** (backend: unit de chunking/retrieval/prompt + API) e **Vitest+Testing Library** (front: chat e estados de erro); fluxo red-green via `/tdd` | Testes demonstram rigor; TDD dá feedback loop consistente ao agente |
| A6 | **SQLite via SQLAlchemy 2** (conversas/mensagens) + volume Docker p/ PDFs | Carga real fica no Qdrant; SQLite = zero infra extra, mais reprodutibilidade no clone limpo; Postgres traria peças móveis sem benefício no escopo |
| A7 | **SSE streaming** no `/chat` | UX moderna de chatbots; demonstra conhecimento de protocolo |
| A8 | **BackgroundTasks do FastAPI** + `GET /documents/{id}/status` (polling no front) | Processamento assíncrono sem Celery/Redis (overkill p/ 8h) |
| A9 | **Múltiplos documentos** por conversa, recuperação filtrada por `document_id` | Qdrant já suporta filtros; demo mais forte, custo incremental baixo |
| A10 | Repo privado **`talkdoc`** criado no GitHub (colaboradores ao fim) | Entrega exige repo privado; `to-spec`/`to-tickets` passam a publicar nele |
| A11 | Backend em camadas: `api/`, `services/`, `repositories/`, `rag/`, `core/` | "Separação de responsabilidades" é quesito avaliado; módulos profundos (skill `/codebase-design`) |
| A12 | Front: **TanStack Query + Tailwind v4 + react-router**; `src/{api,components,pages,hooks,lib}` | Padrão atual de mercado; polling e estados de erro declarativos |
| A13 | Chunking **~800 tokens, 15% overlap**, por tokenização do modelo, **página no metadata** de cada chunk | Página por chunk sustenta o requisito de referências |
| A14 | Recuperação **top-k=5 + threshold de similaridade**; sem reranker | Escopo 8h; reranker documentado como evolução no README |
| A15 | System prompt com regras de fundamentação + contexto com **fontes rotuladas (S1, S2…)** | Modelo cita rótulos; front mapeia rótulo → card de referência |
| A16 | Upload: **máx 20MB, validação por magic bytes `%PDF`**, sanitização de nome, CORS restrito (dev) | Segurança básica sem auth (fora de escopo — limitação documentada) |
| A17 | SSE: **evento inicial com referências** (JSON) + tokens em seguida | Robusto, sem parse de texto; refs sobrevivem a stream cortado |
| A18 | SQLite: `conversations`, `messages` (refs como JSON), `documents` (status) | Persistência suficiente p/ demo; título = primeiro documento |
| A19 | Docker compose: `qdrant` (healthcheck) + `backend` + `frontend` (nginx) + `migrate` (1x) | `docker compose up` reproduzível a partir de clone limpo |
| A20 | README final com diagrama de arquitetura, decisões (ADRs), limitações, uso de IA + **screenshots da execução via Playwright** | Quesito "autoria e decisões"; evidência visual da aplicação rodando |

## Glossário

Criado `CONTEXT.md` com os termos do domínio: Documento, Processamento, Chunk, Índice, Recuperação, Referência, Conversa, Resposta fundamentada.

## ADRs registrados (`docs/adr/`)

- `0001` — Monorepo FastAPI + React/Vite + Docker Compose
- `0002` — Pipeline RAG próprio com abstração de provider
- `0003` — Qdrant como vector store; SQLite para metadados
- `0004` — SSE streaming com referências em evento inicial
- `0005` — BackgroundTasks sem fila distribuída

## Planificação publicada no GitHub (`talkdoc`, privado)

- Spec: issue **#1** (label `ready-for-agent`)
- Tickets tracer-bullet: **#2–#11** (T1–T10), com bordas de bloqueio nativas do GitHub:
  - T1 (#2) livre → T2 (#3) → T3 (#4) → T4 (#5) → T5 (#6)
  - T6 (#7) depende de T2; T7 (#8) de T5+T6; T8 (#9) de T3+T6; T9 (#10) de T7; T10 (#11) de T9
- Labels criados: `ready-for-agent`, `wayfinder:map`
- Fronteira atual: **T1** (Fundação do monorepo) pronto para execução

## Uso de subagentes

- Nenhum subagente ainda; planejamento feito diretamente com protocolos `grilling` + `domain-modeling` (skills model-invoked). Previsão: subagentes paralelos em `/code-review` e `/research` durante a execução.

## Infra de UI/UX, design e segurança (pré-execução)

| Item | Decisão | Justificativa |
|---|---|---|
| A21 | **MCP `playwright`** (`@playwright/mcp`) em `opencode.json` | Navegador real para testes E2E e screenshots com evidência |
| A22 | **Webwright** (Microsoft, MIT, ~6k stars) clonado em `C:\Users\Milena\webwright`; skill `webwright` em `.agents/skills/` | Browser agent terminal-native (código-como-ação): scripts Playwright re-utilizáveis, screenshots e verificação visual por plano de pontos críticos |
| A23 | Subagente **`ui-vision`** (`.opencode/agent/ui-vision.md`, modelo `9router/VisionBetter`) | Auditagem visual de UI/UX: hierarquia, tipografia, contraste WCAG, estados, acessibilidade, com feedback acionável |
| A24 | Skills de design: `web-design-guidelines` + `vercel-composition-patterns` (Vercel) | Revisão de UI contra Web Interface Guidelines; composição React (compound components, render props) |
| A25 | Skills de segurança: `owasp-security-check` (sergiodxa) + `testing-api-security-with-owasp-top-10` (Anthropic) | Checklist OWASP na revisão de código; testes de segurança de API (validação, auth, injeção, SSRF, secrets) |
| A26 | Browsers Playwright instalados (chromium + firefox) | Chromium para o MCP; firefox para o skill webwright |

## Registro da sessão

- 14:54 — instaladas skills de planejamento (8).
- 14:56 — setup do repo: AGENTS.md, docs/agents/issue-tracker.md, docs/agents/domain.md.
- 15:03 — usuário adiciona `Desafio-Tecnico-TalkDoc-v2.md`; leitura do desafio e reinício da fronteira da árvore de design.
- 15:15 — Round 1 do grilling: stack, pipeline RAG próprio, providers, Qdrant, testes.
- 15:20 — Round 2 do grilling: SQLite, SSE, BackgroundTasks, multi-documento.
- 15:25 — `git init` + `.gitignore` (desafio confidencial fora do repo); commit inicial.
- 15:26 — repo privado `talkdoc` criado e primeiro push (`gh repo create --private --source=. --push`).
- 15:30 — Round 3 do grilling: camadas do backend, libs do front, chunking, retrieval, prompt, upload.
- 15:35 — Round 4 do grilling: formato SSE, modelo de dados, docker compose, README (com screenshots via Playwright), publicação de spec/tickets. Fronteira da árvore de design fechada.
- 15:40 — Confirmação do entendimento compartilhado; `/to-spec` publica a spec como issue #1.
- 15:50 — ADRs 0001–0005 registrados; `/to-tickets` publica T1–T10 (#2–#11) com dependências nativas; corpos corrigidos após problema de encoding no round-trip PowerShell.
- 15:55 — Relatório atualizado; commit do planejamento.
- 16:05 — Infra de UI/UX preparada: MCP playwright, Webwright clonado + skill, subagente `ui-vision`, skills de design (Vercel) e segurança (OWASP), browsers instalados.