# Testes

Documentação da suíte de testes automatizados do backend: a escolha do
**Vitest** em vez do **Jest**, a organização em três camadas e o passo a passo
para executar.

## Por que Vitest (e não Jest)

O projeto é **ESM nativo** (`"type": "module"` no `package.json`) e roda
TypeScript **direto no Node 24** (type stripping), com imports usando a
extensão `.ts` explícita (`import db from "./conection.ts"`). Esse contexto
torna o Vitest uma escolha natural e evita bastante "cola" de configuração:

| Critério                   | Vitest                                                                   | Jest                                                                    |
| -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| ESM nativo                 | Suporte de primeira classe                                               | Exige `--experimental-vm-modules` e ajustes de `extensionsToTreatAsEsm` |
| TypeScript                 | Transpila via esbuild (Vite), sem build prévio                           | Exige `ts-jest`/`babel-jest` + preset + config                          |
| Imports com extensão `.ts` | Resolve direto                                                           | Exige `moduleNameMapper` (ex.: `'(.+)\\.ts$': '$1'`) ou equivalente     |
| Isolamento de módulos      | `vi.mock` com fábrica **hoisted** (inclusive `async`)                    | `jest.mock` — funciona, mas com mais atrito em ESM                      |
| Múltiplas camadas          | `test.projects` em um único arquivo, com `env` e seleção por `--project` | Requer várias configs ou `projects` mais verbosos                       |
| Velocidade                 | Transform com esbuild + workers; watch incremental                       | Mais pesado (Babel/ts-jest)                                             |
| API                        | Compatível com Jest (`describe`/`it`/`expect`, `vi` ≈ `jest`)            | —                                                                       |

Em resumo: o Vitest **reaproveita o modelo de módulos do ecossistema Vite/esbuild**,
então roda o código real (Express, Knex, Zod) sem etapa de compilação e sem
mapeamentos frágeis de import. A API é praticamente a do Jest, o que mantém a
curva de aprendizado baixa e a migração trivial, mas sem os problemas de ESM.

> A única dependência adicionada foi o próprio `vitest` (devDependency). Nenhum
> banco, container ou biblioteca extra é necessário para rodar a suíte.

## Camadas de teste

A suíte é dividida em três camadas, cada uma um **project** do Vitest
(ver [`vitest.config.ts`](../vitest.config.ts)):

| Camada        | Pasta               | O que exercita                                                                 | Isolamento                                         |
| ------------- | ------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| `unit`        | `tests/unit`        | Funções puras, schemas Zod, helpers, cálculo de prioridade, protocolo          | Nenhum I/O                                         |
| `integration` | `tests/integration` | Services e middlewares com regras de negócio                                   | Repositories mockados com `vi.mock`                |
| `e2e`         | `tests/e2e`         | App Express real (rotas + middlewares + controllers) via HTTP de ponta a ponta | Persistência mockada; HTTP real em `app.listen(0)` |

## Como rodar

```bash
# Toda a suíte (unit + integration + e2e)
npm test

# Uma camada específica
npm run test:unit
npm run test:integration
npm run test:e2e

# Modo watch (reexecuta ao salvar)
npm run test:watch
```

Opções úteis passando argumentos direto ao Vitest:

```bash
# Um único arquivo
npx vitest run tests/unit/utils.test.ts

# Filtrar por nome de teste (regex)
npx vitest run -t "calculateScore"

# Uma camada + um arquivo
npx vitest run --project e2e tests/e2e/auth.e2e.test.ts

# Cobertura de código (requer @vitest/coverage-v8, opcional)
npx vitest run --coverage
```

Também faz parte do pipeline de verificação de tipos dos testes:

```bash
npm run typecheck:tests   # tsc --noEmit -p tsconfig.test.json
npm run check             # typecheck + typecheck:tests + lint + format:check
```

> Os testes **não** precisam do PostgreSQL nem do `.env`. O `vitest.config.ts`
> injeta as variáveis necessárias (`NODE_ENV=test`, `JWT_SECRET`,
> `COOKIE_NAME`, `PROTOCOL_FPE_KEY`) antes de cada arquivo de teste.

## Estratégia de isolamento

Os testes nunca tocam um banco real. A persistência é substituída por mocks:

- **Conexão com o banco**: `src/database/conection.ts` é mockado para devolver
  um fake knex-like (`tests/helpers/fakeDb.ts`).
- **Repositories**: cada `*.repository.ts` usado pelo service em teste é
  mockado com `vi.mock`, permitindo controlar retornos e simular erros (ex.:
  violação de unicidade `23505`).
- **E2E**: o app Express **real** é iniciado em uma porta efêmera
  (`app.listen(0)`) e as requisições usam o `fetch` nativo via `TestClient`
  (com cookie jar), enquanto os services/repositories são mockados.

Como `vi.mock` é **hoisted** (elevado para o topo do arquivo), as fábricas que
dependem de imports dinâmicos usam `await import(...)`:

```ts
vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});
```

## Estrutura e convenções

```text
tests/
├── helpers/            # utilitários compartilhados (não são testes)
│   ├── fakeDb.ts       # fake knex-like (createFakeDb)
│   ├── http.ts         # startTestServer + TestClient (cookie jar)
│   └── factories.ts    # fábricas: makeToken, makeAuthUser, makeAuthState, ...
├── unit/               # *.test.ts
├── integration/        # *.test.ts
└── e2e/                # *.test.ts
```

- Arquivos de teste seguem o sufixo `*.test.ts` e ficam na pasta da sua camada.
- Imports usam a extensão `.ts` explícita, como no restante do projeto.
- Prefira as fábricas de `tests/helpers/factories.ts` para montar dados
  (tokens, usuários, estado de auth, payload de solicitação, critérios).
- Use os helpers de `tests/helpers/http.ts` para E2E em vez de subir o servidor
  manualmente.

### Exemplo mínimo (unit)

```ts
import { describe, expect, it } from "vitest";
import { calculateScore } from "../../src/modules/prioritization/prioritization.service.ts";
import { makeCriteria } from "../helpers/factories.ts";

describe("prioritization.calculateScore", () => {
  it("calcula a média ponderada normalizada ×10", () => {
    const criteria = makeCriteria(Array(10).fill(5));
    const notes = Object.fromEntries(criteria.map((c) => [c.criterion_id, 5]));
    expect(calculateScore(notes, criteria)).toBe(50);
  });
});
```

### Exemplo mínimo (integration)

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  findUserByEmail: vi.fn(),
  // ...demais funções usadas
}));

afterEach(() => vi.clearAllMocks());
```

### Exemplo mínimo (e2e)

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

describe("minha rota", () => {
  it("responde 200", async () => {
    const client = new TestClient(server.baseUrl);
    const response = await client.get("/health");
    expect(response.status).toBe(200);
  });
});
```
