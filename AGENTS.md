## Agent skills

### Coding standards

Antes de adicionar ou alterar módulos, endpoints, migrations, seeds ou testes, leia `CODING_STANDARDS.md`.

### Issue tracker

Issues e specs vivem no GitHub em `NEO-Kaizen/backend`, operadas com a CLI `gh`. Veja `docs/agents/issue-tracker.md`.

### Triage labels

Apenas `pronto-para-agente` e `pronto-para-humano` são labels de triagem; as demais funções usam o estado da issue ou um comentário. Veja `docs/agents/triage-labels.md`.

### Domain docs

Contexto único: `GLOSSARY.md` e `docs/adr/` na raiz do repositório. Veja `docs/agents/domain.md`.

## Convenções de Git

- Branches: `<type>/<issue>-<slug>` — ex.: `docs/131-harness-skills`, `feat/34-sales-report`.
- Commits: uma linha só, `<type>(<scope>): <imperative description in English>` — ex.: `docs(agents): configure GitHub issue tracker`.
- O tipo do Conventional Commits permanece em inglês (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`); scope, slug e descrição também ficam em inglês.
- Sem corpo e sem footer: o commit é só a linha de assunto, no máximo 72 caracteres; o contexto que não cabe ali vai na descrição do PR.
- Título do PR em inglês; descrição e comentários em português.
