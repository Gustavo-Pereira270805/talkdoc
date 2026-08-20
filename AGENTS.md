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

Fluxo de planejamento: `/grill-with-docs` → `/to-spec` → `/to-tickets` (→ `/wayfinder` se o escopo exceder uma sessão).