import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { DemandBlock } from "../../src/shared/types/requests.ts";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";

// Arquivo isolado: o rate limit é em memória e o módulo é recriado para esta
// suíte, então as 31 chamadas não concorrem com outros testes e2e.
vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
}));

vi.mock("../../src/modules/portalConfig/portalConfig.repository.ts", () => ({
  getSolicitationMode: vi.fn(async () => "PUBLIC"),
}));

vi.mock("../../src/modules/duplicates/duplicates.service.ts", () => ({
  checkDuplicates: vi.fn(async () => ({ confidence: "none", items: [] })),
}));

const DEMAND: DemandBlock = {
  title: "Automatizar conciliação bancária",
  requestType: "Automação",
  category: "Automação",
  processName: "Conciliação bancária mensal",
  description: "Conferência manual de extratos.",
  problem: "Retrabalho no fechamento.",
  expectedResult: "Conciliação automática.",
  justification: "Reduzir esforço manual.",
};

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

describe("E2E — rate limit do Alerta de duplicidade", () => {
  it("responde 429 na 31ª chamada dentro de 10 segundos", async () => {
    const client = new TestClient(server.baseUrl);

    for (let attempt = 1; attempt <= 30; attempt += 1) {
      const response = await client.post("/requests/duplicates/check", { demand: DEMAND });
      expect(response.status).toBe(200);
    }

    const limited = await client.post("/requests/duplicates/check", { demand: DEMAND });

    expect(limited.status).toBe(429);
    expect(limited.headers.get("cache-control")).not.toBe("no-store");
    expect(limited.body).toMatchObject({
      status: "error",
      statusCode: 429,
      message: "Muitas requisições. Tente novamente em instantes.",
    });
  });
});
