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

## Execução — T6: Frontend upload, status e erros (CONCLUÍDO — implementação + tema)

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| G1 | **Página única**: formulário de upload no topo + lista de documentos abaixo | Tudo visível, polling natural, sem navegação extra | **usuário** |
| G2 | **Card por documento com badge de status** (na fila/extraindo/indexando/pronto/falhou) + **animação CSS/HTML** no processamento | Reflete os estados reais do backend (US2/US4); animação dá feedback visual sem percentual falso | **usuário** |
| G3 | Erros **inline**: no formulário (upload inválido) e no card (falha de processamento) | Contextual e simples; sem componente de toast | **usuário** |
| H1 | **Tema terminal escuro**: fundo `#0f1419`, verde fósforo `#33ff66` (sucesso), âmbar `#ffb000` (fila), ciano `#33ccff` (processando), vermelho `#ff4d4d` (erro), texto secundário `#8b949e` | Aprovado entre 3 paletas; contraste alto, legível, autêntico terminal | **usuário** |
| H2 | Fontes **VT323** (títulos/badges/display) + **IBM Plex Mono** (corpo) | VT323 é display (cansa em texto longo); Plex Mono preserva legibilidade | **usuário** |
| H3 | **Mascote gatinho pixel** (SVG 18x16 desenhado à mão, 22 pixels, `shape-rendering: crispEdges`) no header + favicon | Identidade própria, zero "cara de IA" | **usuário** |
| H4 | Detalhes do tema: bordas sólidas 2px, **sombra dura 4px offset** (sem blur), botão com efeito *pressed* (translate), badges sólidos com texto escuro, `blink` animado respeitando `prefers-reduced-motion`, ">" decorativo fora do `<label>` (acessibilidade), erros com `✕` + truncamento | Diretriz "sem gradiente/sem AI-slop" do usuário | agente (vetável) |
| H5 | Sanitização de erros no front (`formatError`): **mascarar `key=`/`token=` em URLs + truncar a ~140 chars** | Incidente real: card exibia URL do provider com chave `AQ.…` (dado velho do T4, persistido no banco) — defesa em profundidade + limpeza do registro (doc 5 rag.pdf) | agente (vetável) + incidente |
| H6 | Skills instaladas: `petergyang/no-ai-slop` (revisão de texto/copy anti-AI-slop, p/ T10/README) + `omer-metin/pixel-art-sprites` (princípios de pixel art) | Pesquisa a pedido do usuário; no-ai-slop 6.5K instalações, fonte confiável | agente (vetável) |
| H7 | **Gatinho de corpo inteiro** (vista lateral sentado, grid 24x20, olhos como "buracos" no tema terminal) substituindo o rosto 18x16 que parecia coração; **rabo com animação `wag` contínua** (0.7s, ±16°, `transform-box: fill-box`, pausa com `prefers-reduced-motion`); posicionado **em pé sobre a barra** do formulário (base sobreposta 2px na borda, `z-10`); favicon atualizado; **ponte de pixels na raiz do rabo** (correção da auditoria — rabo "voador") | Pedido explícito da usuária ("corpo inteiro, simples, rabo mexendo sempre, em pé na barra da caixa de chat"); padrão reutilizável no T7 (chat box) | **usuário** + correção agente (vetável) |
| H8 | Automação do E2E sem processos órfãos: comando único com `try/finally` (sobe o dev server, captura, mata por porta). Proposta p/ T9: Playwright Test `webServer` (start/kill automático) | Feedback da usuária sobre processos que não encerram sozinhos | agente (vetável) |

**Verificação (aceite do T6):**
- **TDD red-green estrito**: 7 testes da página escritos primeiro (red) → implementação → 10 verdes (7 página + 3 `formatError`). Build + oxlint limpos.
- **Debug notável** (não é defeito do produto, é teste): `user.upload` do Testing Library não seta `File` no input (React 19) → `fireEvent.change`; fake timers incompatíveis com `waitFor` do dom 10.4 (só detecta `jest`) → intervalos via `POLL_OPTIONS.intervalMs` mutável; `mockResolvedValueOnce` tem prioridade sobre o persistente (consumido na 1ª chamada) → fila de once-impls encadeada.
- **Docker/E2E real** (Playwright + Chrome): fluxo completo — lista inicial com badges, seleção de arquivo, upload real (202), card processando (badge ciano + blink), transição para "Pronto" via polling (2s) com contagem de páginas. Evidências: `evidence/t6-1..t6-4-*.png`.
- **Auditoria ui-vision** (2 rodadas): 0 problemas críticos; médios (feedback não-só-cor, foco `:focus-visible` global, contraste badges) → **corrigidos** no tema; **incidente de chave na UI identificado pela auditoria** → sanitizado + banco limpo (doc 5, rag.pdf) + registro estranho de teste removido (doc 2).
- **Recomendação ao usuário**: rotacionar a GEMINI_API_KEY (exposta em 2 incidentes: T4 via URL de erro e T6 via dado velho na UI).

## Execução — T7: Frontend conversas, chat e referências

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| I1 | Erros do chat **inline no balão** (vermelho, com ✕) | Contextual, sem componente novo de toast | **usuário** |
| I2 | Indicador "pensando" = **gatinho frontal sentado** (sprite 18x14, novo, delicado) com **rabinho atrás do corpo** — nubs laterais alternando (tail-swap 0.8s, `prefers-reduced-motion` respeitado) + texto "pensando…" | Pedido explícito; sprite frontal distinto do lateral (upload) | **usuário** |
| I3 | **Autoscroll automático** + botão "PULAR PARA O FIM ▾" quando o usuário rola para cima | Não perder contexto nem forçar leitura | **usuário** |
| I4 | **Enter envia**, Shift+Enter quebra linha, botão "ENVIAR ▸" como alternativa | Perguntas frequentes sem mouse | **usuário** |
| I5 | Refs de mensagens salvas renderizam nos **mesmos cards expandíveis** (S1..S5) | Consistência entre histórico e resposta nova | **usuário** |
| I6 | Rótulo **"transmitindo▮"** (cursor blink) + `aria-live="polite"` durante o stream; texto secundário `#b0bac4` (contraste AA); checkbox com borda verde quando selecionado; trecho expandido em `text-sm` | 3 melhorias prioritárias da auditoria ui-vision | agente (vetável) |
| I7 | Parser SSE incremental próprio (`fetch` + ReadableStream): normaliza CRLF, ignora comentários keep-alive, data multi-linha, chunks cortados no meio do evento | EventSource não suporta POST; testado unitariamente (5 casos) | agente (vetável) |
| I8 | No `done` do stream: **invalidate da query de mensagens** → histórico persistido recarrega da API (user+assistant com refs) | AC "histórico recarregado da API" | agente (vetável) |
| I9 | Nav terminal no header ("&gt; documentos / conversas"), título da conversa resolvido pela lista | Coerência com o tema; backend já define título | agente (vetável) |

**Verificação (aceite do T7):**
- **TDD red-green estrito**: 13 testes novos escritos primeiro (5 parser SSE, 5 página de conversas, 4 chat — inclui gate p/ estados de streaming) → 24 verdes no total. Build + lint limpos.
- **E2E real no Docker** (Playwright + Chrome, backend/Qdrant/Groq/Gemini reais): lista → nova conversa → seleção de docs → chat criado (`/conversas/N`) → stream real (rótulo "transmitindo▮" **capturado** com resposta parcial — evidência `t7-4c`) → resposta completa fundamentada com 3 cards de refs → ref expandida → reload com histórico persistido.
- **Auditorias ui-vision** (3 rodadas): sem bloqueadores; melhorias de acessibilidade aplicadas (I6); foco visível global já existia.
- **Diagnóstico de rota**: página /conversas em branco (rotas não registradas no `App.tsx`) — corrigido; warning `shape-rendering` → `shapeRendering` em ambos os sprites.
- **Flakiness de teste diagnosticada**: `findByText` resolvia com a mensagem *pendente* transitória e o `toBeInTheDocument` rodava após a remoção → asserts migradas para `waitFor` (atômico); causa documentada.
- Bug conhecido menor (vetável): o E2E numa conversa com `up.pdf` (doc aleatório) gerou resposta honesta "não sei" — comportamento correto (US9) e desejável.

## Execução — T8: CI no GitHub Actions

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| J1 | **eslint + prettier** no frontend (substituem o oxlint); `lint` → `eslint .`, novo `format:check` → `prettier --check .` | Spec pede explicitamente eslint/prettier — é o que o desafio avalia; oxlint era alternativa mais rápida mas fora da spec | **usuário** |
| J2 | **mypy modo default** no backend (`[tool.mypy]` em `pyproject.toml`: python_version 3.12, `files=app`, `check_untyped_defs`) | Entra no verde sem refatoração massiva de anotações; strict fica documentado como evolução | **usuário** |
| J3 | **Branch protection em `main`**: required checks (`backend` + `frontend`), admins não isentos de checks, sem exigência de review | Spec: "qualquer falha bloqueia o merge" — só status não bloqueia; temos admin no repo | **usuário** |
| J4 | Workflow único `.github/workflows/ci.yml`: gatilhos `push` + `pull_request` em `main`; **2 jobs paralelos** (backend: ruff → mypy → pytest; frontend: eslint → prettier → vitest → build); caches pip/npm; `concurrency` cancela execução antiga; `permissions: contents: read` | AC da issue; jobs paralelos = feedback rápido; sem secrets (testes 100% mockados — nada de Qdrant/chaves no CI) | agente (vetável) |
| J5 | Backend no CI: `python:3.12` (igual à imagem Docker de prod), `pip install --group dev .` (PEP 735) | Consistência prod/CI; sintaxe validada localmente (pip 26) | agente (vetável) |
| J6 | Correção de tipos p/ mypy: iteração indexada no PyMuPDF (`range(len(document))` + `document[index]` — stubs não tipam `__iter__`); `request: dict[str, object]` no payload do Gemini (inferência `Collection[str]` × int) | Mecânico; 2 arquivos | agente (vetável) |
| J7 | Refactor do `ChatPage`: `ChatPage` parseia o id e renderiza `ChatRoom key={id}` — o reset de estado por `useEffect` (com setState no efeito) foi **eliminado** (a regra nova `react-hooks/set-state-in-effect` do eslint acusa como erro) | Remount por `key` é o padrão React idiomático; remove classe de bug de stream travado ao trocar de conversa | agente (vetável) |
| J8 | Frontend normalizado pelo prettier (`--write` em 29 arquivos: aspas simples, sem `;`, printWidth 100, trailingComma all) | Formatação mecânica — o CI passa a exigir | agente (vetável) |

**Verificação (aceite do T8):**
- **Local (pré-push)**: backend — mypy `Success: no issues found in 28 source files`, ruff ✓, pytest 31 ✓. Frontend — eslint 0 problemas, prettier ✓, vitest 25 ✓, build ✓.
- **Remoto — push e PR validados**: PR #12 (branch `feat/t8-ci`) com os 2 checks verdes (backend 40s, frontend 17s) → branch protection ativada em `main` (required checks `backend (ruff, mypy, pytest)` + `frontend (eslint, prettier, vitest, build)`, strict, sem force-push/delete) → merge do PR via caminho protegido → run de `push` em `main` verde (run 32535485245).
- **Teste negativo (prova do bloqueio)**: PR #13 com teste que falha de propósito → check backend FAIL → `gh pr merge` **recusado** (só com `--auto` esperaria, ou `--admin` forçaria) → PR fechado, branch deletada.
- Evidência: `evidence/t8-ci-evidence.txt` (runs, proteção, bloqueio).

## Execução — T9: Imagens de produção e teste de clone limpo

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| K1 | Backend **multi-stage**: builder (`pip install --target=/deps .`) + runtime `python:3.12-slim` com `PYTHONPATH=/deps` (sem pip no runtime); frontend já era multi-stage (node→nginx) | AC da issue; imagem final enxuta; padrão moderno | **usuário** |
| K2 | Clone limpo validado com **project-name isolado** (`talkdoc-clone`) — volumes novos, dados de dev preservados; descoberto que o compose **concatena** listas de `ports` (override somou em vez de substituir) → opção segura: pausar dev, subir clone nas portas padrão, religar dev | Não destruir histórico local; validação 100% fiel | **usuário** |
| K3 | `.dockerignore` (backend: .venv/__pycache__/tests/.env; frontend: node_modules/dist/.env) + `.env.example` com modelos reais (`gpt-oss-120b`, `gemini-embedding-001`) | Contexto de build enxuto, sem segredos na imagem; docs coerentes | agente (vetável) |
| K4 | **BUG REAL ENCONTRADO**: `frontend/nginx.conf` não tinha proxy para a API — prod (nginx) devolvia index.html para GETs da API e **405 para POST** (upload quebrado em produção). E2Es anteriores rodavam no dev server (proxy Vite) e nunca exercitaram o nginx. Fix: `location /documents`, `/conversations` (com `proxy_buffering off` p/ SSE em tempo real) e `/health` → `backend:8000` | AC "fluxo completo num clone limpo" pegou o bug; sem proxy o produto não funcionava em produção | agente (vetável) + bug |
| K5 | Auditoria ui-vision das 5 etapas: sem bloqueadores; botão ENVIAR durante upload já é desabilitado (`disabled={uploading}` — "aceso" no print era artefato de timing do screenshot) | - | agente (vetável) |

**Verificação (aceite do T9):**
- **Clone limpo real**: `git clone` em pasta temp → `.env` copiado → `docker compose up -d --build` (volumes zerados, migrate rodou, Qdrant fresh) → backend healthy, frontend 200.
- **Fluxo completo no clone (:8080, nginx de prod)**: upload do `talkdoc_test.pdf` (PDF gerado, 2 págs) → "Na fila" → **"Pronto" (2 páginas)** com Gemini real num Qdrant zerado → conversa criada → pergunta → resposta com **2 cards de referência âmbar** (`S1 · pág. 2`, `S2 · pág. 1`). Evidências `t9-1..t9-6`.
- **Stack dev**: pausado durante o teste e religado; backend e frontend **reconstruídos com os fixes** (multi-stage + nginx) — `/health` e `/documents` via :8080 OK agora.
- Limpeza: `talkdoc-clone down -v` + pasta temp.

## Execução — T10: Entrega final (README, screenshots e colaboradores)

| # | Decisão | Justificativa | Autor |
|---|---|---|---|
| L1 | README em **PT-BR** | Toda a documentação (ADRs, issues, relatório) já é PT-BR; desafio em português | **usuário** |
| L2 | README com: visão curta e concreta, diagrama Mermaid (fluxo + camadas), "Como rodar" (clone limpo), dev + testes/lint, tabela de ADRs, limitações honestas, **disclosure de uso de IA**, 4 screenshots reais (t9-*) | AC da issue; texto revisado contra a skill `no-ai-slop` (eval.md — sem palavras/padrões banidos) | agente (vetável) |
| L3 | **PAUSE antes de adicionar os colaboradores** (`ygorbalves`, `MateusNavarroR`) — pedido explícito da usuária; o convite é passo separado com aprovação própria | Usuária quer revisar antes do convite | **usuário** |

**Verificação (aceite do T10):**
- README completo (arquitetura/execução/decisões/limitações/IA) + screenshots reais do clone limpo + `.env.example` sem segredos (vazio de valores).
- Colaboradores: **pendente de aprovação** (passo pausado).

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
- 21:0x — Commit+push do T5 (`22c5051`); issue #6 fechada.
- 21:1x — Acordo de trabalho atualizado: **todas as decisões principais passam pelo usuário** (lote + recomendação; mecânicas ficam "vetáveis"). T6: decisões G1–G3 aprovadas (página única, card+badge+animação CSS, erros inline). **Sessão compactada** — handoff em `docs/handoff.md`.
- 22:0x — **Retomada pós-compactação**: T6 implementado com TDD red-green estrito (7 testes primeiro). Deps front instaladas (TanStack Query, react-router-dom, Vitest+Testing Library). Debug de testes: `user.upload`/fake timers/once-impls (registrado).
- 22:1x — Validação Docker + Playwright E2E real (upload→processando→pronto, polling 2s). Auditoria ui-vision: tema aprovado pela usuária (H1–H3: terminal escuro, VT323+Plex Mono, gatinho pixel); skills anti-slop instaladas.
- 22:2x — **Incidente de segurança detectado pela auditoria**: card rag.pdf exibia URL do provider com chave `AQ.…` (dado velho persistido no T4) → sanitização `formatError` no front (mask `key=` + truncar), limpeza do banco (docs 5 e 2), recomendação de rotação da chave. 10 testes verdes, build/lint limpos. Checkpoint aguardando aprovação de commit do T6.
- 22:3x — **Redesign do gatinho** (H7): corpo inteiro 24x20 + rabo com wag contínuo + em pé na barra do formulário; auditoria ui-vision (2 rodadas) aprovou; E2E sem órfãos (H8, try/finally). Container prod sincronizado. Aguardando aprovação de commit do T6 + rotação da chave.
- 22:4x — Ajuste fino do gatinho (pedido da usuária): **base/pernas estreitada** (20px→14px, taper natural do corpo sentado); auditoria aprovou (proporção cabeça:corpo:base ~40:50:10). 10 testes ✓, build/lint ✓, prod sincronizado. Aguardando aprovação de commit do T6.
- 22:5x — Commit+push do T6 (`7169467` docs, `d385474` feat); issue #7 fechada.
- 23:0x — **T7**: decisões I1–I5 aprovadas (erros inline, gatinho frontal com rabinho atrás, autoscroll+botão, Enter envia, cards no histórico). TDD: 13 testes novos → 24 verdes. Rotas registradas no App (diagnóstico), parser SSE incremental, invalidate no done.
- 23:1x — E2E real completo (criar conversa → stream "transmitindo▮" capturado → resposta com 3 refs → histórico recarregado); auditorias ui-vision 3x (melhorias I6 aplicadas); flakiness de teste diagnosticada e corrigida (waitFor atômico). Checkpoint aguardando aprovação de commit do T7.
- 09:0x — **T8**: decisões J1–J3 aprovadas (eslint+prettier, mypy default, branch protection). Backend: mypy instalado e verde (3 erros mecânicos corrigidos: iterador do PyMuPDF + anotação do payload). Frontend: eslint+prettier configurados (flat config, react-hooks/refresh), oxlint removido; refactor do ChatPage (`ChatRoom key={id}`) eliminando setState-em-efeito; prettier normalizou 29 arquivos. 31 testes backend + 25 front + build verdes. Workflow ci.yml escrito. Aguardando aprovação para push/PR/proteção.
- 09:1x — Branch `feat/t8-ci` + PR #12 (checks verdes: backend 40s, frontend 17s); bump das actions (v5/v6 — Node 20 deprecado). Branch protection ativada em `main` (required checks, strict). Merge do PR #12 → run de push em main verde (32535485245). **Teste negativo**: PR #13 com teste que falha → check FAIL → merge recusado pelo gh → PR fechado. Evidência em `evidence/t8-ci-evidence.txt`. Aguardando aprovação para fechar a issue #9.
- 09:2x — Issue #9 fechada. **T9**: decisões K1–K2 aprovadas (multi-stage instalador+runtime; clone isolado). Backend multi-stage escrito + .dockerignore + .env.example corrigido; build local validado. **Clone limpo real**: git clone temp → compose up (volumes zerados) → **BUG REAL: nginx sem proxy de API (405 no POST /documents)** — corrigido (proxy + SSE sem buffer); fluxo completo E2E no clone: upload → pronto (2 páginas) → conversa → resposta com 2 refs. Auditoria ui-vision 5 etapas ok (sem bloqueadores). Dev religado e sincronizado com os fixes. Aguardando aprovação para PR e fechar a issue #10.
- 09:3x — PR #15 (T9) merged com checks verdes; issue #10 fechada. **T10**: decisão L1 (README PT-BR). README escrito (arquitetura Mermaid, execução, dev/tests, ADRs, limitações, IA, 4 screenshots reais) e revisado com a skill `no-ai-slop` (eval.md ok). **Colaboradores PAUSADOS (L3)** por pedido da usuária — passo separado aguardando aprovação. PR do README aberto.