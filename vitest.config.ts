import { defineConfig } from "vitest/config";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Configuração da suíte de testes (Vitest).
 *
 * Quatro camadas, cada uma em um "project" separado:
 * - `unit`: funções puras, schemas Zod e helpers (sem banco, sem HTTP).
 * - `integration`: services e middlewares exercitados com os repositories
 *   mockados (`vi.mock`), validando as regras de negócio em processo.
 * - `e2e`: o app Express real (rotas + middlewares + controllers) atendendo
 *   requisições HTTP de ponta a ponta, com a persistência isolada por mocks.
 * - `db`: persistência real em PostgreSQL descartável (repositories, services
 *   e fluxos HTTP), sem mocks de banco.
 *
 * As variáveis de ambiente abaixo substituem o `.env`: os testes nunca devem
 * apontar para um banco real. `JWT_SECRET` é obrigatório para emitir/validar
 * tokens e `NODE_ENV=test` evita o cookie `secure` (HTTP em localhost).
 */
const baseTestEnv = {
  NODE_ENV: "test",
  TZ: "UTC",
  JWT_SECRET: "vitest-only-secret-key",
  JWT_EXPIRES_IN: "1d",
  COOKIE_NAME: "session_id",
  PROTOCOL_FPE_KEY: "vitest-only-protocol-fpe-key",
};

/**
 * `UPLOAD_DIR` é isolado por project: e2e e db rodam em paralelo e cada um
 * limpa o próprio diretório no `afterAll`. Um diretório único por processo
 * faria um project apagar arquivos do outro.
 */
function testEnv(project: string) {
  return {
    ...baseTestEnv,
    UPLOAD_DIR: join(tmpdir(), `neo-kaizen-test-uploads-${project}-${process.pid}`),
  };
}

const mockReset = {
  mockReset: true,
  restoreMocks: true,
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          env: testEnv("unit"),
          include: ["tests/unit/**/*.test.ts"],
          ...mockReset,
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          env: testEnv("integration"),
          include: ["tests/integration/**/*.test.ts"],
          ...mockReset,
        },
      },
      {
        test: {
          name: "e2e",
          environment: "node",
          env: testEnv("e2e"),
          include: ["tests/e2e/**/*.test.ts"],
          testTimeout: 20_000,
          hookTimeout: 20_000,
          ...mockReset,
        },
      },
      {
        test: {
          name: "db",
          environment: "node",
          env: testEnv("db"),
          include: ["tests/db/**/*.test.ts"],
          globalSetup: ["./tests/helpers/dbGlobalSetup.ts"],
          // Um único banco compartilhado: arquivos rodam em série para que o
          // reset entre testes não concorra com outra suíte.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
          ...mockReset,
        },
      },
    ],
  },
});
