# CI do backend

Workflow do GitHub Actions para o `NEO-Kaizen/backend` (issue #137). CD não faz parte deste escopo.

## O que roda em cada PR

| Check               | O que valida                                                                   |
| ------------------- | ------------------------------------------------------------------------------ |
| `quality (24)`      | typecheck, ESLint e Prettier com Node 24                                       |
| `quality (26)`      | o mesmo com Node 26                                                            |
| `database`          | migrations, seeds, smoke HTTP e Notificações contra PostgreSQL 18              |
| `dependency-review` | dependências adicionadas/alteradas com severidade alta (inicialmente opcional) |

`quality` e `database` pulam PRs em rascunho e também rodam em push na `main`, em `merge_group` e via `workflow_dispatch`. Os nomes dos checks são os `name:` dos jobs; renomear um job exige atualizar o ruleset da `main`.

O Dependabot abre PRs semanais para `npm` e `github-actions`, agrupando minor/patch. A imagem do service container não é atualizada por ele.

## Job `database`

Sequência executada contra o service container `postgres:18-alpine` (mesmo digest de `docker-compose.yml`):

1. as 55 migrations sobem com `npm run migrate:latest`;
2. todas são revertidas com `npx knex migrate:rollback --all --env development` e reaplicadas;
3. as seeds-base rodam duas vezes e as seeds de cenário rodam duas vezes, validando idempotência;
4. a API sobe com `node src/server.ts` e o smoke test chama `GET /portal-config` (rota pública) por até 30 tentativas;
5. `npm run verify:notifications` percorre o ciclo de Pendência pela API e confere as Notificações;
6. `npm run verify:notifications:rollback` emite uma Notificação dentro de uma transação, força rollback e confirma que não sobrou linha órfã.

O rollback precisa acontecer **antes** de qualquer seed: com dados semeados, a migration de auditoria de mapping falha ao reverter. O bug está registrado na issue #142.

Não existe `.env` no runner de propósito: `knexfile.js` carrega o arquivo com `dotenv` e `override: true`, o que sobrescreveria as variáveis do job. Por isso o workflow falha se encontrar um `.env`.

## O que ainda não existe

- Sem imagem Docker da aplicação e sem build/push: a imagem não faz parte da CI.
- Sem CD: deploy está fora do escopo desta issue.
- Sem job de testes: `npm test` ainda é um no-op na `main` e a suíte está em andamento na issue #135. O esqueleto do job está comentado em `ci.yml` com `TODO(#135)`.
- Sem `npm audit` bloqueante: as 5 vulnerabilidades de produção pré-existentes são tratadas separadamente. O `dependency-review` cobre só o diff do PR e começa como não obrigatório.

## Reproduzindo localmente

Com Node 24 (veja `.nvmrc`):

```bash
nvm use
npm ci
npm run check
npm run build
```

Com um PostgreSQL local e as variáveis do `.env`:

```bash
npm run migrate:latest
npx knex migrate:rollback --all --env development
npm run migrate:latest
npm run seed:run
npm run seed:scenarios:run
```

Com a API local no ar (`npm run dev`), rode a verificação de Notificações em
outro terminal:

```bash
npm run verify:notifications
npm run verify:notifications:rollback
```

## Depois do merge (manual, admin)

Estes passos não são aplicados pelo workflow e ainda não estão habilitados:

1. Habilitar o dependency graph: sem ele o `dependency-review` falha com "Dependency review is not supported on this repository".
2. Habilitar o CodeQL default setup para o repositório.
3. Habilitar secret scanning e push protection.
4. Exigir aprovação para rodar workflows de forks.
5. Aplicar o ruleset da `main`: checks obrigatórios `quality (24)`, `quality (26)` e `database`; 1 aprovação; resolução de conversas; branch atualizada; force push e deleção bloqueados.
6. Opcional: tornar `dependency-review` obrigatório depois de observar alguns PRs.
