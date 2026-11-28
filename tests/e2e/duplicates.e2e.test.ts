import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { DemandBlock, InternalRequestRow } from "../../src/shared/types/requests.ts";
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

vi.mock("../../src/modules/portalConfig/portalConfig.repository.ts", () => ({
  getSolicitationMode: vi.fn(),
}));

vi.mock("../../src/modules/duplicates/duplicates.repository.ts", () => ({
  isDuplicateDetectionEnabled: vi.fn(),
  findPublishedPublicIdByRequestId: vi.fn(),
}));

vi.mock("../../src/modules/duplicates/indexLifecycle.ts", () => ({
  searchDuplicateIndex: vi.fn(),
}));

vi.mock("../../src/modules/requests/requests.repository.ts", () => ({
  findInternalRequestByProtocol: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const portalConfigRepository =
  await import("../../src/modules/portalConfig/portalConfig.repository.ts");
const duplicatesRepository = await import("../../src/modules/duplicates/duplicates.repository.ts");
const indexLifecycle = await import("../../src/modules/duplicates/indexLifecycle.ts");
const requestsRepository = await import("../../src/modules/requests/requests.repository.ts");

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

const ITEM = {
  publicId: "8f14e45f-ea3a-4b2c-9c1d-1f7a5e6b2c90",
  title: "Solicitação de Automação em andamento",
  summary: "Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.",
  category: "Automação",
  status: "Em andamento",
  period: "2026-Q4",
};

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("PUBLIC");
  vi.mocked(duplicatesRepository.isDuplicateDetectionEnabled).mockResolvedValue(true);
  vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([]);
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(async () => {
  await server.close();
});

describe("E2E — POST /requests/duplicates/check", () => {
  it("responde 200 com o contrato exato e Cache-Control: no-store", async () => {
    vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([{ ...ITEM, score: 1 }]);

    const client = new TestClient(server.baseUrl);
    const response = await client.post("/requests/duplicates/check", { demand: DEMAND });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.body).toEqual({ confidence: "high", items: [ITEM] });

    const body = response.body as { items: Record<string, unknown>[] };
    expect(Object.keys(body).sort()).toEqual(["confidence", "items"]);
    expect(Object.keys(body.items[0] ?? {}).sort()).toEqual([
      "category",
      "period",
      "publicId",
      "status",
      "summary",
      "title",
    ]);
    expect(indexLifecycle.searchDuplicateIndex).toHaveBeenCalledWith(expect.any(String), 20);
  });

  it("degrada para 200 vazio e loga a causa quando a busca falha", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(duplicatesRepository.isDuplicateDetectionEnabled).mockRejectedValue(
      new Error("banco indisponível"),
    );

    const client = new TestClient(server.baseUrl);
    const response = await client.post("/requests/duplicates/check", { demand: DEMAND });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.body).toEqual({ confidence: "none", items: [] });
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("recusa body inválido com 422 e fields", async () => {
    const client = new TestClient(server.baseUrl);

    const missing = await client.post("/requests/duplicates/check", {
      demand: { ...DEMAND, title: undefined },
    });
    expectErrorEnvelope(missing, { statusCode: 422 });
    expect((missing.body as { fields?: Record<string, string> }).fields).toHaveProperty(
      "demand.title",
    );

    const unknownDemandKey = await client.post("/requests/duplicates/check", {
      demand: { ...DEMAND, protocol: "MAAT-ABCD-EFGH" },
    });
    expectErrorEnvelope(unknownDemandKey, { statusCode: 422 });

    const unknownRootKey = await client.post("/requests/duplicates/check", {
      demand: DEMAND,
      email: "maria@neo.com",
    });
    expectErrorEnvelope(unknownRootKey, { statusCode: 422 });

    expect(duplicatesRepository.isDuplicateDetectionEnabled).not.toHaveBeenCalled();
    expect(indexLifecycle.searchDuplicateIndex).not.toHaveBeenCalled();
  });

  it("exige sessão no modo AUTHENTICATED (401)", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");

    const client = new TestClient(server.baseUrl);
    const response = await client.post("/requests/duplicates/check", { demand: DEMAND });

    expectErrorEnvelope(response, { statusCode: 401 });
    expect(duplicatesRepository.isDuplicateDetectionEnabled).not.toHaveBeenCalled();
    expect(indexLifecycle.searchDuplicateIndex).not.toHaveBeenCalled();
  });
});

function makeRequestRow(overrides: Partial<InternalRequestRow> = {}): InternalRequestRow {
  return {
    request_id: "42",
    requester_user_id: 1,
    requester_name: "Maria Solicitante",
    requester_email: "maria@neo.com",
    title: DEMAND.title,
    request_type: DEMAND.requestType,
    category: DEMAND.category,
    process_name: DEMAND.processName,
    need_description: DEMAND.description,
    problem_opportunity: DEMAND.problem,
    expected_result: DEMAND.expectedResult,
    justification: DEMAND.justification,
    ...overrides,
  } as unknown as InternalRequestRow;
}

const OWN_PUBLIC_ID = "11111111-1111-4111-8111-111111111111";
const PROTOCOL = "MAAT-ABCD-EFGH";

function mockSolicitanteSession(): void {
  vi.mocked(authRepository.getAuthState).mockResolvedValue(
    makeAuthState({ profile_name: "solicitante" }),
  );
}

function solicitanteCookie(): Record<string, string> {
  return { cookie: `session_id=${makeToken({ id: "1", role: "Solicitante" })}` };
}

describe("E2E — GET /requests/:protocol/duplicates", () => {
  it("exige identidade no modo PUBLIC (401 genérico)", async () => {
    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/duplicates`);

    expectErrorEnvelope(response, { statusCode: 401 });
    expect(requestsRepository.findInternalRequestByProtocol).not.toHaveBeenCalled();
  });

  it("recusa perfil interno com o mesmo 403 do Acompanhamento", async () => {
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ profile_name: "analista" }),
    );

    const token = makeToken({ id: "1", role: "Analista", email: "maria@neo.com" });
    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/duplicates`, {
      cookie: `session_id=${token}`,
    });

    expectErrorEnvelope(response, {
      statusCode: 403,
      message: "Perfis internos devem acompanhar pela consulta interna.",
    });
    expect(requestsRepository.findInternalRequestByProtocol).not.toHaveBeenCalled();
  });

  it("terceiro autenticado recebe 404 sem revelar a existência", async () => {
    mockSolicitanteSession();
    vi.mocked(requestsRepository.findInternalRequestByProtocol).mockResolvedValue(
      makeRequestRow({ requester_user_id: 2 }),
    );

    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/duplicates`, solicitanteCookie());

    expectErrorEnvelope(response, { statusCode: 404, message: /encontrado/ });
  });

  it("sessão do Solicitante com Posse devolve o DTO do alerta e exclui a própria Solicitação", async () => {
    mockSolicitanteSession();
    vi.mocked(requestsRepository.findInternalRequestByProtocol).mockResolvedValue(makeRequestRow());
    vi.mocked(duplicatesRepository.findPublishedPublicIdByRequestId).mockResolvedValue(
      OWN_PUBLIC_ID,
    );
    vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([
      { ...ITEM, publicId: OWN_PUBLIC_ID, score: 2 },
      { ...ITEM, score: 1 },
    ]);

    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/duplicates`, solicitanteCookie());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.body).toEqual({ confidence: "high", items: [ITEM] });
  });

  it("responde vazio quando a própria Solicitação não está publicada", async () => {
    mockSolicitanteSession();
    vi.mocked(requestsRepository.findInternalRequestByProtocol).mockResolvedValue(makeRequestRow());
    vi.mocked(duplicatesRepository.findPublishedPublicIdByRequestId).mockResolvedValue(undefined);
    vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([{ ...ITEM, score: 1 }]);

    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/duplicates`, solicitanteCookie());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ confidence: "none", items: [] });
  });

  it("identidade pública válida devolve a seção no modo PUBLIC", async () => {
    vi.mocked(requestsRepository.findInternalRequestByProtocol).mockResolvedValue(makeRequestRow());
    vi.mocked(duplicatesRepository.findPublishedPublicIdByRequestId).mockResolvedValue(
      OWN_PUBLIC_ID,
    );
    vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([{ ...ITEM, score: 1 }]);

    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/duplicates`, {
      "x-requester-identity": JSON.stringify({
        name: "Maria Solicitante",
        email: "maria@neo.com",
      }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ confidence: "high", items: [ITEM] });
  });
});
