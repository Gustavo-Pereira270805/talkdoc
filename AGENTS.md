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