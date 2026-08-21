# AGENTS.md

Guia para agentes de IA que trabalham neste repositório.

## Agent skills

### Issue tracker

Issues, specs e tickets vivem como GitHub issues, gerenciadas via CLI `gh`. Ver `docs/agents/issue-tracker.md`.

### Domain docs

Layout single-context: um `CONTEXT.md` na raiz + `docs/adr/`. Ver `docs/agents/domain.md`.

## Skills instaladas

Skills do [mattpocock/skills](https://github.com/mattpocock/skills) em `.agents/skills/`:

- `grill-with-docs` — entrevista de planejamento que constrói domínio, `CONTEXT.md` e ADRs
- `wayfinder` — mapa de decision tickets para trabalho grande
- `to-spec` — converte conversa em spec
- `to-tickets` — decompõe spec em tickets tracer-bullet
- `grilling`, `domain-modeling`, `codebase-design` — primitivas model-invoked

Extras (design, segurança, browser):

- `webwright` (Microsoft) — browser agent terminal-native: scripts Playwright para testes de UI/UX e screenshots com evidência (framework em `C:\Users\Milena\webwright`)
- `web-design-guidelines` + `vercel-composition-patterns` (Vercel) — revisão de UI contra Web Interface Guidelines; padrões de composição React
- `owasp-security-check` (sergiodxa) — checklist OWASP para revisão de código
- `testing-api-security-with-owasp-top-10` (Anthropic) — testes de segurança de API

Fluxo de planejamento: `/grill-with-docs` → `/to-spec` → `/to-tickets` (→ `/wayfinder` se o escopo exceder uma sessão).

## MCP e subagentes

- MCP `playwright` configurado em `opencode.json` (navegador real para testes E2E)
- Subagente `ui-vision` (`.opencode/agent/ui-vision.md`) — visão para auditagem de UI/UX de screenshots
- `image-analyzer` (global) — análise genérica de imagens

## Working agreement (acordo de trabalho com o usuário)

Abordagem **mista com decisões focalizadas + checkpoints visuais**, nível **imersivo**.

- **Todas as decisões principais passam pelo usuário** (arquitetura, providers, libs, schema, UX/comportamento, escopo/ordem, infra). Apresentação em lote com opções + recomendação marcada para aprovação/veto rápidos (máx. 2-3 blocos por ticket).
- **Decisões mecânicas** (nomenclatura, estrutura interna de teste, estilo, valores triviais) o agente decide e registra como "vetável" — o usuário pode derrubá-las depois lendo o relatório.
- **Ritmo por ticket**: brief (o que/por quê/como validar) → decisões principais (aprovação do usuário) → execução TDD **red-green estrito** (teste primeiro) → checkpoint visual/evidência → aprovação do usuário antes de qualquer commit/push.
- **Nunca** commitar ou dar push sem permissão explícita do usuário.
- Nível imersivo: em tickets de backend, explicar o código ao usuário em tempo real (pair programming guiado), sem jargão desnecessário; porquês de 1-2 linhas em português.
- Toda decisão é registrada em `docs/session-report.md` (tabela de decisões + log), marcando "decidido pelo usuário" vs "decidido pelo agente (vetável)".
- Checkpoint: mostrar evidência (screenshot auditada pelo `ui-vision` em frontend; testes/curl em backend) e atualizar issues e relatório.