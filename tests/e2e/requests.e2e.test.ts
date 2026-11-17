import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { makeAuthState, makeRequestPayload, makeToken } from "../helpers/factories.ts";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";

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

vi.mock("../../src/modules/requests/requests.service.ts", () => ({
  findRequest: vi.fn(),
  registerRequest: vi.fn(),
  listRequestsByEmail: vi.fn(),
  findInternalByProtocol: vi.fn(),
  getTracking: vi.fn(),
  updateInternalRequest: vi.fn(),
  listAssignees: vi.fn(),
  assignResponsible: vi.fn(),
  assignAnalyst: vi.fn(),
  updateRequestStatus: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const portalConfigRepository =
  await import("../../src/modules/portalConfig/portalConfig.repository.ts");
const service = await import("../../src/modules/requests/requests.service.ts");

let server: TestServer;
const PROTOCOL = "MAAT-ABCD-EFGH";

beforeAll(async () => {
  server = await startTestServer();
});

afterEach(() => {
  vi.clearAllMocks();
});

function publicMode() {
  vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("PUBLIC");
}

describe("E2E — rotas de solicitação (modo PUBLIC)", () => {
  it("exige o parâmetro email na listagem pública", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const missing = await client.get("/requests");
    expect(missing.status).toBe(400);
    expect(missing.body).toMatchObject({ message: "Parâmetro obrigatório ausente: email" });

    const invalid = await client.get("/requests?email=nao-email");
    expect(invalid.status).toBe(400);
  });

  it("lista solicitações por e-mail delegando ao service", async () => {
    publicMode();
    const page = { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
    vi.mocked(service.listRequestsByEmail).mockResolvedValue(page);

    const client = new TestClient(server.baseUrl);
    const response = await client.get("/requests?email=maria@neo.com");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(page);
    expect(service.listRequestsByEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "maria@neo.com", page: 1, pageSize: 10 }),
    );
  });

  it("exige identidade no acompanhamento público (dual-auth)", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.get(`/requests/${PROTOCOL}/tracking`);
    expect(response.status).toBe(401);
  });

  it("acompanha a solicitação com o header X-Requester-Identity", async () => {
    publicMode();
    const tracking = { protocol: PROTOCOL, status: "Em triagem" };
    vi.mocked(service.getTracking).mockResolvedValue(tracking as never);

    const client = new TestClient(server.baseUrl);
    const response = await client.get(`/requests/${PROTOCOL}/tracking`, {
      "x-requester-identity": JSON.stringify({ name: "Maria", email: "maria@neo.com" }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(tracking);
    expect(service.getTracking).toHaveBeenCalledWith(PROTOCOL, {
      user: undefined,
      requesterIdentity: { name: "Maria", email: "maria@neo.com" },
    });
  });
});

describe("E2E — POST /requests (validação)", () => {
  it("exige a parte multipart 'payload'", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/requests", {});
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Parte 'payload' ausente no corpo da requisição.",
    });
  });

  it("rejeita payload com JSON inválido", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/requests", { payload: "{nao-e-json" });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: "A parte 'payload' contém um JSON inválido." });
  });

  it("rejeita payload sem os blocos obrigatórios (Zod)", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/requests", { payload: JSON.stringify({}) });
    expect(response.status).toBe(400);
    expect(String((response.body as { message: string }).message)).toContain(
      "Campos obrigatórios ausentes",
    );
  });

  it("cria a solicitação com payload válido (201)", async () => {
    publicMode();
    vi.mocked(service.registerRequest).mockResolvedValue({
      protocol: PROTOCOL,
      status: "Solicitação enviada",
    } as never);

    const client = new TestClient(server.baseUrl);
    const response = await client.post("/requests", {
      payload: JSON.stringify(makeRequestPayload()),
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ protocol: PROTOCOL });
    expect(service.registerRequest).toHaveBeenCalledOnce();
  });
});

describe("E2E — rotas internas exigem sessão", () => {
  it("bloqueia consulta interna e troca de status sem autenticação", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    expect((await client.get(`/requests/${PROTOCOL}/internal`)).status).toBe(401);
    expect(
      (
        await client.patch(`/requests/${PROTOCOL}/status`, {
          targetStatus: 3,
          justification: "ok",
        })
      ).status,
    ).toBe(401);
  });

  it("valida o corpo da troca de status (400 sem justificativa)", async () => {
    publicMode();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState());
    const token = makeToken({ role: "Analista" });
    const client = new TestClient(server.baseUrl);

    const response = await client.request("PATCH", `/requests/${PROTOCOL}/status`, {
      body: { targetStatus: 3 },
      headers: { cookie: `session_id=${token}` },
    });

    expect(response.status).toBe(400);
    expect(service.updateRequestStatus).not.toHaveBeenCalled();
  });
});
