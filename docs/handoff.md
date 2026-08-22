# Handoff — TalkDoc (YAITEC)

**Leia este arquivo antes de qualquer ação.** A sessão anterior foi compactada com contexto vazio. Este documento resume o estado completo do projeto.

## O projeto

- **Desafio**: TalkDoc v2 (YAITEC Solutions) — app web de RAG sobre PDF. Repo privado `https://github.com/Gustavo-Pereira270805/talkdoc` (colaboradores `ygorbalves` e `MateusNavarroR` entram no fim). Prazo 48h, ~8h esforço.
- **Usuário**: Gustavo — Windows 11, opencode, PT-BR. Trabalha em modo **imersivo** (explicar código em tempo real, sem jargão). **Nunca commitar/push sem permissão explícita**.
- **Workdir**: `C:\Users\Milena\OneDrive\Documentos\programas\projeto_yaitec` (repo git).

## Acordo de trabalho (AGENTS.md)

- **Todas as decisões principais passam pelo usuário** (arquitetura, providers, libs, schema, UX, escopo, infra) — apresentar em lote, com opções + recomendação marcada.
- Decisões mecânicas: o agente decide e registra como "vetável".
- **TDD red-green estrito** (testes PRIMEIRO) — obrigatório desde T6. No T5 houve violação reconhecida.
- Checkpoint visual/evidência ao fim de cada ticket + aprovação antes de commit.

## Estado atual (tickets)

- ✅ T1–T10 completos — **todas as issues fechadas** (spec #1 + tickets #2–#11)
- ✅ **Colaboradores convidados** (22/08, permissão write): `ygorbalves` e `MateusNavarroR` — **aguardando aceite dos e-mails** (verificar em `gh api repos/.../invitations`)
- ✅ Pós-entrega: sidebar retrátil (PR #17), markdown no chat (PR #18), flipbook do rabo (PRs #19/#20), OWASP hardening (PR #21), narrativa do relatório (PR #22), correção de gênero/nome do usuário (commit 2267331)
- ⚠️ **branch protection reforçada**: `enforce_admins: true` — nem admin faz push direto em `main` (lição do push direto acidental)
- 📄 `docs/session-report.md` abre com "Narrativa de processo — protagonismo do candidato" + "Painel de ferramentas"

## Estado do repositório

- `main` com T1–T8. **Branch protection ativa**: em `main` só entra por PR com os 2 checks verdes (sem push direto!). Working tree: limpo.
- Containers Docker rodando (qdrant healthy, backend healthy, frontend up).
- **Pendência de segurança**: rotacionar `GEMINI_API_KEY` no Google AI Studio (exposta em 2 incidentes históricos — já sanitizados). A chave atual ainda funciona.
- **Skills globais instaladas**: `no-ai-slop` (texto/README), `pixel-art-sprites`, além das do repo.

## Ambiente e comandos

- Stack rodando: `docker compose up -d` (qdrant :6333, backend :8000, frontend :8080). Containers atuais: qdrant healthy, backend healthy, frontend up.
- `.env` na raiz (gitignored): `GROQ_API_KEY=gsk_…` (válida), `GEMINI_API_KEY=AIza…` (válida). **Não expor valores em logs/erros** (chave por header `x-goog-api-key`, nunca query param).
- Backend local: venv em `backend/.venv` (Python 3.13 Windows); testes: `backend/.venv/Scripts/python.exe -m pytest`; lint: `backend/.venv/Scripts/ruff.exe check .`.
- Python default do sistema é MinGW (`C:\msys64`) — **usar o Python do Windows** (`C:\Users\Milena\AppData\Local\Programs\Python\Python313`) para venvs.
- PowerShell: escrever arquivos via ferramenta Write; evitar round-trip de texto com Set-Content (corrompe acentos); aspas aninhadas em `python -c` quebram — usar arquivos temp.
- Portas 8000/6333/8080 livres (containers antigos `meu-app-ia`/`meu-banco-vetorial` removidos).

## Fatos críticos do backend (evitar re-descobrir)

- **Modelo embedding real**: `gemini-embedding-001` com `outputDimensionality: 768` (o `text-embedding-004` da spec NÃO existe na conta — 404). Distância: cosseno.
- **Modelo chat real**: `openai/gpt-oss-120b` (Llama 3.3 70B não existe no free tier da Groq; 13 modelos listados). Streaming via API OpenAI-compatível.
- Chave Gemini aceita formato novo `AQ.…` também (header funciona).
- `Retriever`: top-k=5, threshold 0.3, filtro por múltiplos document_ids (MatchAny), payload Qdrant = document_id/page/text/filename.
- Status do documento: `queued → extracting → (embed+index) → ready` ou `failed` (motivo em `error`); PDF escaneado (sem texto) → failed com mensagem clara.
- SSE: `event: references` (JSON) → `event: token`×N → `event: done`; falha → `event: error`.
- Bug conhecido já corrigido: método `list` em repository faz shadowing do builtin — usar `list_all`.
- Coleção Qdrant `chunks` criada no boot (lifespan best-effort; pytest usa no-op via fixture autouse).

## Git

- `main` com T1–T5 (commits acima). NÃO commitado: `AGENTS.md` (acordo atualizado), `docs/session-report.md` (decisões G1–G3 + log), `docs/handoff.md` (este), `evidence/` (screenshots).
- Usuário precisa autorizar commit do bloco de infra (AGENTS/report/handoff) — perguntar.

## Docs de referência

- `docs/session-report.md` — relatório completo (decisões A1–A26, B1–B10, C1–C8, D1–D6, E1–E7, F1–F7, G1–G3)
- `docs/adr/0001..0005` — ADRs de arquitetura
- `CONTEXT.md` — glossário do domínio
- `AGENTS.md` — acordo de trabalho + skills instaladas (mattpocock, webwright, design Vercel, OWASP, MCP playwright, subagente ui-vision)