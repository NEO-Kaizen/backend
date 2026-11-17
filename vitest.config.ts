import { defineConfig } from "vitest/config";

/**
 * Configuração da suíte de testes (Vitest).
 *
 * Três camadas, cada uma em um "project" separado:
 * - `unit`: funções puras, schemas Zod e helpers (sem banco, sem HTTP).
 * - `integration`: services e middlewares exercitados com os repositories
 *   mockados (`vi.mock`), validando as regras de negócio em processo.
 * - `e2e`: o app Express real (rotas + middlewares + controllers) atendendo
 *   requisições HTTP de ponta a ponta, com a persistência isolada por mocks.
 *
 * As variáveis de ambiente abaixo substituem o `.env`: os testes nunca devem
 * apontar para um banco real. `JWT_SECRET` é obrigatório para emitir/validar
 * tokens e `NODE_ENV=test` evita o cookie `secure` (HTTP em localhost).
 */
const testEnv = {
  NODE_ENV: "test",
  JWT_SECRET: "vitest-only-secret-key",
  JWT_EXPIRES_IN: "1d",
  COOKIE_NAME: "session_id",
  PROTOCOL_FPE_KEY: "vitest-only-protocol-fpe-key",
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          env: testEnv,
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          env: testEnv,
          include: ["tests/integration/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "e2e",
          environment: "node",
          env: testEnv,
          include: ["tests/e2e/**/*.test.ts"],
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
    ],
  },
});
