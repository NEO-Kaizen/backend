## Agent skills

### Coding standards

Antes de adicionar ou alterar módulos, endpoints, migrations, seeds ou testes, leia `CODING_STANDARDS.md`.

### Issue tracker

Issues e specs vivem no GitHub em `NEO-Kaizen/backend`, operadas com a CLI `gh`. Veja `docs/agents/issue-tracker.md`.

### Triage labels

Apenas `pronto-para-agente` e `pronto-para-humano` são labels de triagem; as demais funções usam o estado da issue ou um comentário. Veja `docs/agents/triage-labels.md`.

### Domain docs

Contexto único: `GLOSSARY.md` e `docs/adr/` na raiz do repositório. Veja `docs/agents/domain.md`.

### Workflow

As skills de engenharia ficam em `.opencode/skills/`. O fluxo principal é:

`/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` → `/code-review`

Use `/pr` para abrir e descrever pull requests e `/triage` para a triagem no GitHub.

## Context7

Use o Context7 MCP durante a sessão para consultar documentação atualizada de bibliotecas quando a resposta depender de API, configuração ou versão.

A chave fica em `.context7API` na raiz, ignorado pelo Git e negado ao agente pelas regras de `read`, `edit` e `shell` em `opencode.jsonc`. O `opencode.jsonc` lê o arquivo com `{file:.context7API}`, sem exportar variável de ambiente.

## Permissões

O `opencode.jsonc` define as permissões de shell, leitura e edição. Por padrão, comandos de shell pedem confirmação; a allowlist cobre operações de leitura, Git e scripts do `package.json`. Arquivos `.env`, `.env.*` (exceto `.env.example`) e `.context7API` são negados ao agente.

## Convenções de Git

- Branches: `<type>/<issue>-<slug>` — ex.: `docs/131-harness-skills`, `feat/34-sales-report`.
- Commits: uma linha só, `<type>(<scope>): <imperative description in English>` — ex.: `docs(agents): configure GitHub issue tracker`.
- O tipo do Conventional Commits permanece em inglês (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`); scope, slug e descrição também ficam em inglês.
- Sem corpo e sem footer: o commit é só a linha de assunto, no máximo 72 caracteres; o contexto que não cabe ali vai na descrição do PR.
- Título do PR em inglês; descrição e comentários em português.
