import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { makeAuthState, makeToken } from "../helpers/factories.ts";
import {
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
}));

vi.mock("../../src/modules/queue/queue.service.ts", () => ({
  getQueueMetricsService: vi.fn(),
  listQueueService: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const service = await import("../../src/modules/queue/queue.service.ts");

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await server.close();
});

function gestorSession() {
  vi.mocked(authRepository.getAuthState).mockResolvedValue(
    makeAuthState({ profile_name: "gestor" }),
  );
  return { cookie: `session_id=${makeToken({ role: "Gestor" })}` };
}

describe("E2E — GET /queue com filtros e ordenação", () => {
  it("encaminha data, departamento e ordenação validados ao service", async () => {
    const headers = gestorSession();
    vi.mocked(service.listQueueService).mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      assignees: [],
      departments: [],
    });
    const client = new TestClient(server.baseUrl);

    const response = await client.get(
      "/queue?page=1&pageSize=10&search=MAAT&createdFrom=2026-11-01&createdTo=2026-11-30&department=Desenvolvimento&sortBy=protocol&sortOrder=asc",
      headers,
    );

    expect(response.status).toBe(200);
    expect(service.listQueueService).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 10,
        search: "MAAT",
        createdFrom: "2026-11-01",
        createdTo: "2026-11-30",
        department: "Desenvolvimento",
        sortBy: "protocol",
        sortOrder: "asc",
      },
      expect.objectContaining({ role: "Gestor" }),
    );
  });

  it("responde 400 para data invertida e ordenação fora do contrato", async () => {
    const headers = gestorSession();
    const client = new TestClient(server.baseUrl);

    const inverted = await client.get(
      "/queue?page=1&pageSize=10&createdFrom=2026-12-01&createdTo=2026-11-30",
      headers,
    );
    expectErrorEnvelope(inverted, { statusCode: 400 });

    const invalidSort = await client.get(
      "/queue?page=1&pageSize=10&sortBy=requests.created_at",
      headers,
    );
    expectErrorEnvelope(invalidSort, { statusCode: 400 });
    expect(service.listQueueService).not.toHaveBeenCalled();
  });

  it("mantém o bloqueio de Solicitante ao usar os novos filtros", async () => {
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ profile_name: "solicitante" }),
    );
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/queue?page=1&pageSize=10&department=Desenvolvimento", {
      cookie: `session_id=${makeToken({ role: "Solicitante" })}`,
    });

    expectErrorEnvelope(response, { statusCode: 403 });
    expect(service.listQueueService).not.toHaveBeenCalled();
  });
});
