# Resumo do Desafio — TalkDoc v2 (YAITEC)

> Documento de entrega: o que foi construído, como foi construído e o que isso demonstra.
> Para o detalhamento completo (decisões por ticket, log, ferramentas), ver `docs/session-report.md`.

## O que foi entregue

**TalkDoc** — assistente de conversa sobre PDFs: o usuário envia um documento, o sistema extrai o texto, indexa num banco vetorial e responde perguntas com **citação das fontes** (rótulos S1..S5 em cards clicáveis com trecho e página). Streaming token a token, com honestidade de "não sei" quando o documento não contém a resposta.

**Stack real**: FastAPI + SQLAlchemy/SQLite + Qdrant + Google Gemini (embeddings, 768 dims) + Groq (LLM, streaming SSE) + React/Vite/Tailwind + Docker Compose + nginx.

## Entregas por ticket (T1–T10, todos fechados)

| Ticket | Entrega |
|---|---|
| T1 | Monorepo + docker compose (qdrant/migrate/backend/frontend), saúde verificada |
| T2 | Upload com validação real: magic bytes `%PDF`, teto 20MB em streaming, nome sanitizado, armazenamento UUID |
| T3 | Processamento: PyMuPDF + chunking (800 tokens, 15% overlap, sem cruzar páginas), status de ponta a ponta |
| T4 | Indexação real no Qdrant com Gemini (coleção 768/cosseno, filtro multi-documento) |
| T5 | Chat RAG com SSE: referências → tokens → done; persistência; fundamentação obrigatória |
| T6 | Frontend de upload com tema terminal escuro + gatinho pixel; erros sanitizados |
| T7 | Conversas e chat: streaming, referências expandíveis, histórico persistido |
| T8 | CI no GitHub Actions: ruff/mypy/pytest + eslint/prettier/vitest/build, branch protection com prova de bloqueio |
| T9 | Imagens multi-stage + **clone limpo validado** (upload → processamento → chat do zero) |
| T10 | README completo, screenshots reais, colaboradores convidados |

## Números

- **71 testes automatizados** (33 backend + 38 front), TDD red-green estrito desde o início da implementação
- **10 PRs** (9 merged com checks verdes + 1 deliberadamente quebrado provando o bloqueio do CI), 11 issues gerenciadas no GitHub
- **E2E reais** com Chrome + Groq + Gemini de verdade, evidências em screenshots (`evidence/t1-*.png` … `t10-*.png`)
- **5 ADRs** documentando cada decisão de arquitetura

## Processo (o que isso demonstra)

- **Engenharia com IA sob governança humana**: todas as decisões principais (arquitetura, providers, libs, UX, escopo, infra) foram tomadas pelo candidato em lotes com recomendação — e uma violação desse acordo foi detectada e corrigida por ele no meio do projeto
- **TDD estrito**: testes escritos antes do código em todos os tickets; bugs reais pegos pelos testes (magic bytes, parser SSE, escape JSX)
- **Qualidade assistida por ferramentas**: auditorias visuais por subagente de visão (ui-vision) em cada etapa visual, incluindo 5 ciclos iterativos de feedback até o flipbook do gatinho; auditoria OWASP completa pós-entrega (3 achados corrigidos)
- **Reprodutibilidade provada**: clone limpo → `docker compose up` → fluxo completo funcionando
- **Rastreabilidade total**: decisões com autoria explícita (usuário vs agente "vetável"), log de sessão, handoffs multi-sessão

## Ferramentas usadas nas sessões (amostra)

Skills de planejamento (grill-with-docs, to-spec, to-tickets), MCP Playwright + webwright (E2E), subagente ui-vision (auditoria visual compensando a ausência de visão do assistente), LSP pyright, Vitest/Testing Library/pytest, GitHub Actions com branch protection via `gh`, Docker multi-stage com validação em clone isolado, no-ai-slop + pixel-art-sprites (pedidas pelo candidato), OWASP security check, pip-audit/npm audit.

## Limitações (documentadas, não escondidas)

Sem autenticação (ok para demo local; seria o próximo passo antes de expor na internet), sem OCR para PDFs escaneados (falha honesta com mensagem clara — ponto de troca documentado), sem reranker, rate limiting recomendado e registrado como evolução.

## Pendências

- Aceite dos convites de colaborador (`ygorbalves`, `MateusNavarroR`)
- Rotação da `GEMINI_API_KEY` (recomendação de segurança pós-incidente histórico já sanitizado)

---

**TalkDoc no GitHub**: https://github.com/Gustavo-Pereira270805/talkdoc — repo público, CI verde, README com screenshots da aplicação real rodando.