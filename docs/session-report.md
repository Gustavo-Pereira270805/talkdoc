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
- Fronteira atual: **T1** (Fundação do monorepo) — **em execução**

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

## Execução — T1: Fundação do monorepo e docker compose

| # | Decisão | Justificativa |
|---|---|---|
| B1 | Backend com `pyproject.toml` (hatchling), deps mínimas (fastapi, uvicorn, sqlalchemy, pydantic-settings) e dev group (pytest, httpx, ruff) | Pacote pequeno e rápido de instalar no Docker; lint com ruff (`E,F,I,UP,B`) |
| B2 | Modelos SQLAlchemy 2 declarativos: `documents` (status enum `StrEnum`: queued/extracting/indexing/ready/failed), `conversations`, `messages` (refs JSON) + associação `conversation_documents` (multi-documento) | Reflete A9/A18; schema já cobre os tickets seguintes |
| B3 | `migrate.py` idempotente via `Base.metadata.create_all` (sem Alembic) rodando como serviço compose `migrate` (`python -m scripts.migrate`) | Schema simples; Alembic seria overkill; `-m` garante import de `app.*` |
| B4 | Config via pydantic-settings: `DATABASE_URL`, `QDRANT_URL`, `CORS_ORIGINS` (CSV) com defaults docker | Zero config para subir; chaves (Groq/Gemini) entram só no T4/T5 |
| B5 | `/health` retorna `{"status":"ok"}` (rota em `app/api/routes/health.py`) | Healthcheck do compose e sonda do backend |
| B6 | Compose: `qdrant` (healthcheck `/dev/tcp`), `migrate` (completa 1x), `backend` (depende de qdrant healthy + migrate completed), `frontend` (nginx, 8080) | Orquestração determinística sem script externo |
| B7 | Compose funciona **sem `.env`**: interpolação `${VAR:-default}`; `.env.example` documenta chaves | `docker compose up` a partir de clone limpo sem config prévia (critério de aceite) |
| B8 | Frontend: Vite 8 + React 19 + TS 6 + Tailwind v4 (`@tailwindcss/vite`); estrutura `src/{api,components,pages,hooks,lib}`; nginx serve o build | Scaffold oficial + decisão A12; pasta vazia no T1 com `.gitkeep` |
| B9 | `pyrightconfig.json` no backend apontando `venvPath=.` / `venv=.venv` | Python default do sistema é MinGW (layout Unix); LSP precisava achar o venv Windows |
| B10 | Containers antigos (`meu-app-ia`, `meu-banco-vetorial`, de 30/07) parados e removidos | Ocupavam as portas 8000/6333; autorizado pelo usuário |

**Verificação (aceite do T1):**
- `docker compose build` → imagens `talkdoc-backend`, `talkdoc-migrate`, `talkdoc-frontend`.
- `docker compose up -d` → qdrant `healthy`, migrate saiu com código 0, backend `healthy`, frontend up.
- `GET http://localhost:8000/health` → `{"status":"ok"}`.
- `GET http://localhost:8080/` → HTTP 200 (HTML TalkDoc); renderizado e verificado via MCP Playwright; screenshot em `evidence/t1-frontend-foundation.png`.
- Log do migrate: `Schema pronto. Tabelas: conversation_documents, conversations, documents, messages`.
- Testes locais: 3 passed (health + migrate cria schema + idempotência), ruff limpo.

## Execução — T2: Upload de Documento com validação

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| C1 | PDF salvo em **volume Docker `uploads/`** no backend | Simples, já existente no compose; T3 lê o arquivo localmente. Suficiente p/ escopo | **usuário** |
| C2 | `POST /documents` → **202** `{id, filename, status:"queued"}` | Comunica aceite + assíncrono, coerente com polling do T3 | **usuário** |
| C3 | Validação por **magic bytes `%PDF`** + leitura em chunks (64KB) com teto | Não carrega arquivos gigantes na memória; content-type é forjável | agente (vetável) |
| C4 | Mapeamento de erros: **400** vazio, **413** >20MB, **415** não-PDF, com `detail` em PT-BR | Semântica HTTP correta + mensagens compreensíveis (US3) | agente (vetável) |
| C5 | Sanitização: remove caminho (`Path().name`), acentos (NFKD), inseguros→`_`; garante `.pdf` | Anti path-traversal (OWASP) + nomes legíveis; teste `café relatório!.pdf`→`cafe_relatorio.pdf` | agente (vetável) |
| C6 | Arquivo em disco com **nome UUID** + coluna `stored_filename` no modelo | Evita colisão de nomes; liga banco↔disco para o T3 | agente (vetável) |
| C7 | Camadas: `api/routes/documents.py`, `services/upload.py`, `repositories/documents.py`, `api/schemas.py`, `db/deps.py` (`get_db`) | Decisão A11; `get_db` é o seam testável | agente (vetável) |
| C8 | `python-multipart`; `HTTP_413_CONTENT_TOO_LARGE` (nome novo pós-depreciação) | UploadFile exige a lib; zerar warnings | agente (vetável) |

**Verificação (aceite do T2):**
- 8 testes passando (valid, 415, 413, sanitização, vazio) + ruff limpo.
- Curl real no Docker: PDF válido → 202 `{id:1,filename:teste.pdf,status:queued}`; não-PDF → 415; >20MB → 413 `"Arquivo excede o limite de 20MB."`.
- Arquivos com UUID em `uploads/`; registros em `documents` com `stored_filename` (via `docker compose cp` + sqlite).

## Execução — T3: Processamento (extração, chunking e status)

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| D1 | **PyMuPDF** para extração | Escolha do usuário; rápido e robusto (texto/imagens/CJK); wheels manylinux → instala sem compilar no `python:3.12-slim`; custo real = imagem ~+40MB. Detecção de PDF escaneado: texto vazio → `failed` com motivo claro (US16) | **usuário** |
| D2 | Calcular + validar chunks por teste; **persistir só `status` + `page_count`** | T4 refaz extração/chunking e indexa no Qdrant; sem schema duplicado agora | **usuário** |
| D3 | Tokenização **heurística por palavras**; chunks **não cruzam páginas** (página = 1º token); overlap clampado (nunca regride) | Determinística p/ testes; referência por página mais limpa; sem tokenizer externo (ponto de troca documentado) | agente (vetável) |
| D4 | `BackgroundTasks` dispara `process_document` com **sessão própria** (`SessionLocal`) | A sessão da requisição já fechou quando o background roda; evita conexão órfã | agente (vetável) |
| D5 | Em pytest o background vira **no-op** (monkeypatch); caminho real validado no Docker | `:memory:` do conftest não tem schema; teste determinístico do `ProcessingService` direto | agente (vetável) |
| D6 | `GET /documents` (lista) + `GET /documents/{id}` (status/page_count/error) + `DocumentDetailOut`; 404 se inexistente | API da spec; consumida pelo frontend (T6) | agente (vetável) |

**Verificação (aceite do T3):**
- 22 testes passando (chunker: divisão, overlap, página, sem palavra cortada, não cruza página; processamento: ready, page_count multi-página, escaneado→failed, lista, 404) + ruff limpo.
- Curl no Docker: upload `texto.pdf` → `queued` → (background) → `ready` com `page_count: 2`; `scan.pdf` → `failed` com motivo "não foi possível extrair texto (pode ser PDF escaneado)".

## Execução — T4: Índice no Qdrant com embeddings reais (Gemini)

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| E1 | Métrica **cosseno** na coleção do Qdrant | Padrão para similaridade semântica de texto | **usuário** |
| E2 | Falha do Gemini no processamento → documento `failed` com motivo | Consistente com T3; simples e previsível | **usuário** |
| E3 | **`gemini-embedding-001` com `outputDimensionality: 768`** | `text-embedding-004` da spec **não disponível na conta** (descoberto via `ListModels`; retornava "model not found"); gemini-embedding-001 é estável e suporta 768 | agente (vetável) |
| E4 | `EmbedderClient` como **Protocol** + `GeminiEmbedder` (httpx REST) | A2: troca de provider não toca o pipeline (aceite T4); fake determinístico nos testes | agente (vetável) |
| E5 | **Chave por header `x-goog-api-key`** (não query param) + erro limpo (sem URL) | Incidente real: chave vazou na URL de um erro 404; header evita vazamento em logs (OWASP); usuário alertado p/ rotacionar token antigo | agente (vetável) |
| E6 | `QdrantIndexer`: coleção `chunks` (768/cosseno), point id `doc_id*100000+idx`, payload `document_id+page+text`, `search` com filtro por documento | A9/ADR-0003; pontos com id inteiro (Qdrant exige int/UUID) | agente (vetável) |
| E7 | Coleção criada no **boot** (lifespan) best-effort + `ensure_collection` sob demanda; pytest com no-op do Qdrant (fixture autouse) | Aceite T4; testes rápidos e determinísticos (6s vs 40s) | agente (vetável) |

**Verificação (aceite do T4):**
- 24 testes passando + ruff limpo.
- Docker (chave real): upload `rag.pdf` → `ready` (page_count 3); coleção `chunks` com 3 pontos, dim 768, cosseno; payloads `document_id:7` + `page:1..3` + texto (via scroll REST do Qdrant).
- Detalhes do caminho: chave inicial era token OAuth (`AQ.`) → trocada por API key (`AIzaSy`, 39 chars); aspas simples no `.env` são removidas pelo Compose (valor correto no container); `ListModels` revelou modelos disponíveis.

## Execução — T5: Chat RAG com SSE

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| F1 | Threshold de similaridade **0.3** (configurável via `.env`) | Equilíbrio para embeddings Gemini; descarta lixo sem perder trechos úteis | **usuário** |
| F2 | Zero resultados acima do threshold → **LLM com contexto vazio** (diz "não sei") | US9 explícita: admitir ausência em vez de inventar | **usuário** |
| F3 | Modelo de chat **`openai/gpt-oss-120b`** (configurável) | Llama 3.3 70B **não disponível no free tier** da conta (ListModels confirmou); gpt-oss-120b é o mais forte dos 13 disponíveis; `qwen/qwen3.6-27b` como alternativa | agente (vetável) |
| F4 | SSE: `event: references` (JSON) → `event: token`… → `event: done`; falhas → `event: error` com mensagem limpa | Decisão A17; refs sobrevivem a stream cortado; erros compreensíveis (US10) | agente (vetável) |
| F5 | Persistência só **no fim do stream** (user + assistant com refs) | Nada parcial se a conexão cortar | agente (vetável) |
| F6 | `embed_query` (taskType RETRIEVAL_QUERY) no Protocol; `search` por **vários document_ids** (MatchAny); `filename` no payload do upsert | Query embedding ≠ doc embedding; multi-documento (A9); refs mostram o nome do arquivo | agente (vetável) |
| F7 | **Lição de processo**: T5 implementado antes dos testes (violação do TDD) — reconhecido pelo usuário; bug real pego após: método `list` fazendo sombra ao builtin (`list[dict]` quebrou no import) → renomeado para `list_all` | TDD estrito retomado a partir do T6 | agente + **usuário** |

**Verificação (aceite do T5):**
- 31 testes passando + ruff limpo.
- Docker (chave real): upload talkdoc.pdf → ready; conversa criada (título = nome do arquivo); chat SSE real: `references` (S1, página 1, filename), ~30 eventos `token` (streaming GPT-OSS-120B), `done`; resposta fundamentada citando [S1]; mensagens persistidas (user + assistant com 1 ref).

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
- 17:0x — Início da execução do **T1** (permissão para commitar/push em aberto): backend esqueleto (main, config, /health), modelos SQLAlchemy 2, migrate idempotente, testes (3 passed), ruff limpo.
- 17:2x — Frontend scaffold (Vite+React+TS+Tailwind v4, estrutura src/{api,components,pages,hooks,lib}), Dockerfiles (backend/migrate/frontend-nginx), docker-compose (qdrant+migrate+backend+frontend), .env.example.
- 17:3x — Docker Desktop iniciado (instalação por-usuário); containers antigos de estudo removidos (autorizado); `docker compose up` validado: qdrant healthy, migrate (4 tabelas), /health OK, frontend 200; screenshot de evidência.
- 17:4x — Verificação do LSP: pyright não achava deps (usava Python MinGW); `pyrightconfig.json` aponta para o venv. Decisões B1–B10 registradas no relatório.
- 18:0x — **Acordo de trabalho** revisado com o usuário (nível 3 imersivo; voz em backend/arquitetura + UX) e formalizado no AGENTS.md. Commit+push do T1 (`d1a496f`); issue #2 fechada.
- 18:1x — **T2** executado (TDD): teste red → UploadService (magic bytes, chunks com teto, sanitização, UUID), repository, schema, rota POST /documents (202/400/413/415), `stored_filename` no modelo, `python-multipart`. 8 testes green, ruff limpo; validação real no Docker (curl: 202/415/413) + arquivos UUID em `uploads/` + registros no DB.
- 18:2x — Decisões C1–C8 registradas; checkpoint apresentado ao usuário.
- 18:4x — Commit+push do T2 (`0a751ad`); issue #3 fechada.
- 19:0x — **T3** (imersivo): usuário escolheu **PyMuPDF** (explicado honestamente o tradeoff Docker) e **calcular+validar por teste, persistir só status+page_count**. Chunker (heurística por palavras, sem cortar palavra, página no metadata, não cruza página), extrator PyMuPDF, ProcessingService com sessão própria, BackgroundTasks no POST, GET /documents + /documents/{id}. TDD pegou 2 bugs de asserção no teste + background atacando :memory: (resolvido com no-op em pytest + validação real no Docker).
- 19:1x — Validação no Docker: texto.pdf → ready (page_count 2); scan.pdf → failed com motivo. Decisões D1–D6 registradas.
- 19:3x — Commit+push do T3 (`402e6d8`); issue #4 fechada.
- 19:5x — **T4**: usuário escolheu cosseno + failed com motivo. EmbedderClient (Protocol) + GeminiEmbedder (header auth), QdrantIndexer (coleção 768/cosseno, upsert com payload, search filtrado), lifespan no boot, fakes nos testes. Incidente de segurança: chave vazou em URL de erro → corrigido (header + erro limpo), usuário orientado a rotacionar. Chave inicial (AQ.) inválida; nova (AIzaSy) com aspas no .env (Compose resolve). `text-embedding-004` indisponível na conta → `gemini-embedding-001` (768).
- 20:0x — Validação Docker: rag.pdf → ready; Qdrant com 3 pontos (doc 7, páginas 1-3, payload ok). Decisões E1–E7 registradas.
- 20:1x — Commit+push do T4 (`1b0bd13`); issue #5 fechada. Nova chave Gemini (formato AQ., 53 chars) testada: válida via header; gemini-embedding-001 confirmado; fluxo completo ready.
- 20:3x — **T5**: usuário escolheu threshold 0.3 + contexto vazio→"não sei". Implementação (GroqLLM, prompts, retriever, ChatService, rotas SSE, repositories). **Violação de TDD reconhecida** (código antes dos testes) + bug de shadowing `list` corrigido (`list_all`). Groq: Llama 3.3 70B indisponível → `openai/gpt-oss-120b`.
- 20:5x — Validação Docker: chat SSE real (references S1 → tokens → done, resposta citando [S1]); mensagens persistidas. Decisões F1–F7 registradas; TDD estrito retomado a partir do T6.