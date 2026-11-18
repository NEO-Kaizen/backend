# CI do backend



Workflow do GitHub Actions para o `NEO-Kaizen/backend` (issue #137). CD não faz parte deste escopo.



## O que roda em cada PR



| Check               | O que valida                                                                   |

| ------------------- | ------------------------------------------------------------------------------ |

| `quality (24)`      | typecheck, ESLint, Prettier e contrato OpenAPI com Node 24                     |

| `quality (26)`      | o mesmo com Node 26                                                            |

Sequ?ncia executada contra o service container `postgres:18-alpine` (mesmo digest de `docker-compose.yml`):

| `test`              | `npm run verify` (check + suíte unit/integration/e2e/db) com PostgreSQL 18     |
2. o job insere em `audit_history` uma linha de cada `entity_type` da cadeia de CHECK (`prioritization`, `settings`, `request`, `mapping` e `pending_item`), exercita rollback parcial para cada migration da cadeia (reverte o ?ltimo passo, confirma que o `INSERT` do valor removido ? rejeitado e que o valor adjacente ainda permitido ? aceito, sobe de volta) e, ao final, reverte todas as migrations com `npx knex migrate:rollback --all --env development`;
| `dependency-review` | dependências adicionadas/alteradas com severidade alta (inicialmente opcional) |
4. as seeds-base rodam duas vezes e as seeds de cen?rio rodam duas vezes, validando idempot?ncia;
5. a API sobe com `node src/server.ts` e o smoke test chama `GET /portal-config` (rota p?blica) por at? 30 tentativas.

O rollback parcial ? necess?rio porque `--all` dropa `audit_history` ao final: sem ele, o CI n?o provaria que cada `down` recria um CHECK `NOT VALID` que continua barrando novos `INSERT`s inv?lidos, nem que o `up` seguinte n?o quebra com hist?rico j? gravado (issue #142).



O Dependabot abre PRs semanais para `npm` e `github-actions`, agrupando minor/patch. A imagem do service container não é atualizada por ele.



## Job `database`



Sequ?ncia executada contra o service container `postgres:18-alpine` (mesmo digest de `docker-compose.yml`):



1. as migrations sobem com `npm run migrate:latest`;

2. o job insere em `audit_history` uma linha de cada `entity_type` da cadeia de CHECK (`prioritization`, `settings`, `request`, `mapping` e `pending_item`), exercita rollback parcial para cada migration da cadeia (reverte o ?ltimo passo, confirma que o `INSERT` do valor removido ? rejeitado e que o valor adjacente ainda permitido ? aceito, sobe de volta) e, ao final, reverte todas as migrations com `npx knex migrate:rollback --all --env development`;

3. as migrations sobem de novo;

4. as seeds-base rodam duas vezes e as seeds de cen?rio rodam duas vezes, validando idempot?ncia;

5. a API sobe com `node src/server.ts` e o smoke test chama `GET /portal-config` (rota p?blica) por at? 30 tentativas.



O rollback parcial ? necess?rio porque `--all` dropa `audit_history` ao final: sem ele, o CI n?o provaria que cada `down` recria um CHECK `NOT VALID` que continua barrando novos `INSERT`s inv?lidos, nem que o `up` seguinte n?o quebra com hist?rico j? gravado (issue #142).



`npm run check` inclui `docs:check`: valida `docs/type-inference.md`,

`docs/openapi.json` e a paridade entre as rotas reais do Express e a spec. O

checker importa a app (sem conectar ao banco) e ignora as rotas de

infraestrutura `/api-docs*` e `/uploads*`.



Não existe `.env` no runner de propósito: `knexfile.js` carrega o arquivo com `dotenv` e `override: true`, o que sobrescreveria as variáveis do job. Por isso o workflow falha se encontrar um `.env`.



## Job `test`



O job sobe um service `postgres:18-alpine` (mesmo digest de `docker-compose.yml`),

exporta `TEST_DB_*`, `TZ=UTC` e `UPLOAD_DIR` e roda `npm run verify` com Node 24.

O `globalSetup` da camada `db` aplica as migrations no banco de teste; cada

arquivo limpa os dados mutáveis e mantém os dados de referência.



As variáveis `TEST_DB_*` são separadas das `DB_*` do job `database` de propósito:

a suíte nunca carrega o `.env` e recusa um banco cujo nome não contenha `test`.



## O que ainda não existe



- Sem imagem Docker da aplicação e sem build/push: a imagem não faz parte da CI.

- Sem CD: deploy está fora do escopo desta issue.

- Sem `npm audit` bloqueante: as 5 vulnerabilidades de produção pré-existentes são tratadas separadamente. O `dependency-review` cobre só o diff do PR e começa como não obrigatório.



## Reproduzindo localmente



Com Node 24 (veja `.nvmrc`):



```bash

nvm use

npm ci

npm run check

npm run build

```



Para reproduzir o job `test` (inclui a camada `db`):



```bash

npm run test:db:up

npm run verify

npm run test:db:down

```



Com um PostgreSQL local e as variáveis do `.env`:



```bash

npm run migrate:latest

npx knex migrate:rollback --all --env development

npm run migrate:latest

npm run seed:run

npm run seed:scenarios:run

```



Para reproduzir o cenário da CI, insira ao menos uma linha em `audit_history` antes de rodar o `migrate:rollback --all`: o rollback precisa aceitar auditoria já gravada.



## Depois do merge (manual, admin)



Estes passos não são aplicados pelo workflow e ainda não estão habilitados:



1. Habilitar o dependency graph: sem ele o `dependency-review` falha com "Dependency review is not supported on this repository".

2. Habilitar o CodeQL default setup para o repositório.

3. Habilitar secret scanning e push protection.

4. Exigir aprovação para rodar workflows de forks.

5. Aplicar o ruleset da `main`: checks obrigatórios `quality (24)`, `quality (26)` e `database`; 1 aprovação; resolução de conversas; branch atualizada; force push e deleção bloqueados.

6. Opcional: tornar `dependency-review` obrigatório depois de observar alguns PRs.

