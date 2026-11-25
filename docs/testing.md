# Testes

Documentação da suíte de testes automatizados do backend: a escolha do
**Vitest**, a organização em quatro camadas, o banco descartável dos testes de
persistência e o passo a passo para executar localmente e no CI.

## Por que Vitest (e não Jest)

O projeto é **ESM nativo** (`"type": "module"` no `package.json`) e roda
TypeScript direto no Node 24 (type stripping), com imports usando a extensão
`.ts` explícita (`import db from "./conection.ts"`). Esse contexto torna o
Vitest uma escolha natural e evita bastante "cola" de configuração:

| Critério                   | Vitest                                                                   | Jest                                                                    |
| -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| ESM nativo                 | Suporte de primeira classe                                               | Exige `--experimental-vm-modules` e ajustes de `extensionsToTreatAsEsm` |
| TypeScript                 | Transpila via esbuild (Vite), sem build prévio                           | Exige `ts-jest`/`babel-jest` + preset + config                          |
| Imports com extensão `.ts` | Resolve direto                                                           | Exige `moduleNameMapper` (ex.: `'(.+)\\.ts$': '$1'`) ou equivalente     |
| Isolamento de módulos      | `vi.mock` com fábrica **hoisted** (inclusive `async`)                    | `jest.mock` — funciona, mas com mais atrito em ESM                      |
| Múltiplas camadas          | `test.projects` em um único arquivo, com `env` e seleção por `--project` | Requer várias configs ou `projects` mais verbosos                       |
| Velocidade                 | Transform com esbuild + workers; watch incremental                       | Mais pesado (Babel/ts-jest)                                             |
| API                        | Compatível com Jest (`describe`/`it`/`expect`, `vi` ≈ `jest`)            | —                                                                       |

A decisão foi registrada na issue #135. A única dependência adicionada foi o
próprio `vitest` (devDependency).

## Camadas de teste

A suíte é dividida em quatro camadas, cada uma um **project** do Vitest (ver
[`vitest.config.ts`](../vitest.config.ts)):

| Camada        | Pasta               | O que exercita                                                                | Persistência                                |
| ------------- | ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| `unit`        | `tests/unit`        | Funções puras, schemas Zod, helpers, priorização, protocolo e filtros de fila | Nenhum I/O                                  |
| `integration` | `tests/integration` | Services e middlewares com regras de negócio                                  | Repositories mockados; transação observável |
| `e2e`         | `tests/e2e`         | App Express real (rotas + middlewares + controllers) via HTTP                 | Persistência mockada; multer/upload reais   |
| `db`          | `tests/db`          | Repositories, services e fluxos HTTP reais                                    | PostgreSQL descartável, sem mocks de banco  |

A camada `db` é a autoridade para persistência: constraints, transações,
rollback e auditoria não são "provados" pela camada de mocks. Um teste de
service com repository mockado valida a regra de negócio; um teste `db` valida
o que realmente chega ao banco.

## Como rodar

```bash
# Sobe o PostgreSQL descartável da suíte db (perfil `test` do docker compose)
npm run test:db:up

# Toda a suíte (unit + integration + e2e + db)
npm test

# Camadas isoladas
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:db

# Modo watch (a camada db exige o PostgreSQL no ar)
npm run test:watch

# Gate completo usado no CI: check + test
npm run verify

# Derruba e recria o banco de teste do zero
npm run test:db:down
```

As camadas `unit`, `integration` e `e2e` **não** precisam do PostgreSQL; apenas
`db` (e, portanto, `npm test`/`npm run verify`) exige o serviço no ar.

Opções úteis passando argumentos direto ao Vitest:

```bash
# Um único arquivo
npx vitest run tests/unit/utils.test.ts

# Filtrar por nome de teste (regex)
npx vitest run -t "calculateScore"

# Uma camada + um arquivo
npx vitest run --project e2e tests/e2e/auth.e2e.test.ts
```

## Banco descartável

O `docker-compose.yml` tem o serviço `postgres-test`, no profile `test`:

- porta local `55432` (não conflita com o `postgres` de desenvolvimento);
- usuário/senha/banco `neo_test`;
- `tmpfs` em `/var/lib/postgresql`: `npm run test:db:down` remove o container e
  o banco volta vazio.

A suíte `db` lê `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_NAME`, `TEST_DB_USER`
e `TEST_DB_PASSWORD`, com os defaults acima. O helper
[`tests/helpers/testDb.ts`](../tests/helpers/testDb.ts) **recusa** rodar se o
nome do banco não contiver `test` — proteção contra apontar para o banco de
desenvolvimento por engano.

Antes dos testes, o `globalSetup` aplica as migrations reais. Entre testes, o
helper trunca apenas dados mutáveis (`users`, `requesters`, `requests`,
`details_professional`, `audit_history`) e preserva os dados de referência das
migrations (profiles, categories, statuses, priorities, criteria, settings).
Como `audit_history` é append-only por trigger, o reset desabilita triggers de
usuário somente dentro da transação de limpeza
(`SET LOCAL session_replication_role = replica`).

## Estratégia de isolamento

- O `.env` **nunca** é usado pelos testes: o `vitest.config.ts` injeta
  `NODE_ENV=test`, `TZ=UTC`, segredos de teste e um `UPLOAD_DIR` temporário.
- Nas camadas sem banco, `src/database/conection.ts` é mockado. O
  `tests/helpers/fakeDb.ts` é **fail-closed**: aceita apenas a escrita de
  auditoria que os services fazem fora dos repositories e lança erro em
  qualquer outra query/tabela. As transações são observáveis (commit/rollback)
  e os eventos de auditoria ficam registrados para asserção.
- Na camada `db`, a conexão mockada aponta para a instância de teste real. Não
  há mock de repository/service: os testes provam constraints, transações,
  rollback e `recordAudit` contra o PostgreSQL.
- Cada arquivo `db` roda em série (`fileParallelism: false`) porque compartilha
  o mesmo banco; o `beforeEach` limpa o estado.
- Cada arquivo E2E sobe o app em porta efêmera no `beforeAll` e fecha no
  `afterAll`.

## Convenções

- Arquivos seguem `*.test.ts` e ficam na pasta da camada.
- Teste **comportamento**, não implementação: evite fixar ordem de chamadas
  internas quando o efeito observável (SQL, resposta, estado no banco) basta.
- Use as fábricas de [`tests/helpers/factories.ts`](../tests/helpers/factories.ts)
  em vez de duplicar fixtures; prefira DTOs reais a casts frouxos.
- Use [`tests/helpers/http.ts`](../tests/helpers/http.ts) para E2E: ele mantém
  o cookie jar, expõe os atributos de `Set-Cookie`, aplica timeout nas
  requisições e valida o envelope de erro (`status`, `statusCode`, `message`,
  `fields`).
- `vi.resetAllMocks()`/`mockReset: true` entre testes: `clearAllMocks` não
  remove implementações e pode vazar `mockResolvedValue` para o teste seguinte.
- Uploads usam `FormData` real; valide MIME, limite de 10 MB e máximo de 5
  anexos na camada E2E, e a persistência do anexo na camada `db`.
- Injete clock/ID/RNG quando o comportamento depender deles. Sem `sleep`.
- Cubra caminhos de erro e regras de negócio; cobertura é consequência, não
  meta.

## Cobertura documentada

| Área                                  | Onde está coberta                                        |
| ------------------------------------- | -------------------------------------------------------- |
| Autenticação, sessão e troca de senha | `unit` (JWT/senha), `integration` (service), `db` (HTTP) |
| Middlewares e autorização             | `integration` (auth/roles/dual/access) e `e2e` (/users)  |
| Usuários e perfis                     | `integration` (service) e `db` (constraints/auditoria)   |
| Solicitações                          | `e2e` (contrato/multipart) e `db` (persistência real)    |
| Upload                                | `e2e` (multer + limites) e `db` (anexo persistido)       |
| Priorização, protocolo, validação     | `unit`                                                   |
| Configuração do portal (mappers)      | `unit`                                                   |

Lacunas conhecidas ficam registradas no PR que adicionar o comportamento; não
use um teste de mock para declarar uma área "coberta".

## CI

O job `test` do GitHub Actions sobe um service `postgres:18-alpine`, exporta
`TEST_DB_*`, `TZ=UTC` e `UPLOAD_DIR`, e roda `npm run verify` com Node 24. O
job `quality` continua rodando `npm run check` na matriz Node 24/26.

Para reproduzir o job localmente:

```bash
nvm use
npm ci
npm run test:db:up
npm run verify
npm run test:db:down
```
