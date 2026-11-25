import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
import {
  makeAuthState,
  makeCreateRequestResponse,
  makeRequestPayload,
  makeToken,
  makeTrackingResponse,
} from "../helpers/factories.ts";
import {
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import Config from "../../src/configs.ts";

// Contrato HTTP e upload com o service mockado. A persistência real (service +
// Postgres + anexos) está em `tests/db/requests.service.test.ts` e
// `tests/db/requests.http.test.ts`.
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

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(async () => {
  await server.close();
  await rm(Config.UPLOAD_DIR, { recursive: true, force: true });
});

function publicMode() {
  vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("PUBLIC");
}

function formWithPayload(payload: unknown): FormData {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  return form;
}

describe("E2E — rotas de solicitação (modo PUBLIC)", () => {
  it("exige o parâmetro email na listagem pública", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const missing = await client.get("/requests");
    expectErrorEnvelope(missing, {
      statusCode: 400,
      message: "Parâmetro obrigatório ausente: email",
    });

    const invalid = await client.get("/requests?email=nao-email");
    expectErrorEnvelope(invalid, { statusCode: 400 });
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
    expectErrorEnvelope(response, { statusCode: 401 });
  });

  it("acompanha a solicitação com o header X-Requester-Identity", async () => {
    publicMode();
    const tracking = makeTrackingResponse();
    vi.mocked(service.getTracking).mockResolvedValue(tracking);

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
    expectErrorEnvelope(response, {
      statusCode: 400,
      message: "Parte 'payload' ausente no corpo da requisição.",
    });
  });

  it("rejeita payload com JSON inválido", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/requests", { payload: "{nao-e-json" });
    expectErrorEnvelope(response, {
      statusCode: 400,
      message: "A parte 'payload' contém um JSON inválido.",
    });
  });

  it("rejeita payload sem os blocos obrigatórios (Zod)", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/requests", { payload: JSON.stringify({}) });
    expectErrorEnvelope(response, { statusCode: 400, message: /Campos obrigatórios ausentes/ });
  });

  it("cria a solicitação com payload válido (201)", async () => {
    publicMode();
    const created = makeCreateRequestResponse({ protocol: PROTOCOL });
    vi.mocked(service.registerRequest).mockResolvedValue(created);

    const client = new TestClient(server.baseUrl);
    const response = await client.post("/requests", {
      payload: JSON.stringify(makeRequestPayload()),
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ protocol: PROTOCOL });
    expect(service.registerRequest).toHaveBeenCalledOnce();
  });
});

describe("E2E — POST /requests (multipart real)", () => {
  it("processa anexo válido e entrega os metadados ao service", async () => {
    publicMode();
    const created = makeCreateRequestResponse({ protocol: PROTOCOL });
    vi.mocked(service.registerRequest).mockResolvedValue(created);

    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());
    form.append(
      "attachments",
      new File([Buffer.from("%PDF-1.4 teste")], "documento.pdf", { type: "application/pdf" }),
    );

    const response = await client.request("POST", "/requests", { rawBody: form });

    expect(response.status).toBe(201);
    expect(service.registerRequest).toHaveBeenCalledOnce();

    const attachments = vi.mocked(service.registerRequest).mock.calls[0]?.[1];
    expect(attachments).toHaveLength(1);
    expect(attachments?.[0]).toMatchObject({
      fileName: "documento.pdf",
      mimeType: "application/pdf",
    });
  });

  it("rejeita MIME não permitido", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());
    form.append("attachments", new File(["texto"], "nota.txt", { type: "text/plain" }));

    const response = await client.request("POST", "/requests", { rawBody: form });

    expectErrorEnvelope(response, {
      statusCode: 400,
      message: /Formato de arquivo não permitido/,
    });
    expect(service.registerRequest).not.toHaveBeenCalled();
  });

  it("rejeita mais de 5 anexos", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());

    for (let index = 0; index < 6; index += 1) {
      form.append(
        "attachments",
        new File([`pdf-${index}`], `documento-${index}.pdf`, { type: "application/pdf" }),
      );
    }

    const response = await client.request("POST", "/requests", { rawBody: form });
    expectErrorEnvelope(response, { statusCode: 400, message: /Máximo de 5 anexos/ });
  });

  it("rejeita anexo acima de 10 MB", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1);
    form.append("attachments", new File([oversized], "grande.pdf", { type: "application/pdf" }));

    const response = await client.request("POST", "/requests", { rawBody: form });
    expectErrorEnvelope(response, { statusCode: 400, message: /no máximo 10MB/ });
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

    expectErrorEnvelope(response, { statusCode: 400 });
    expect(service.updateRequestStatus).not.toHaveBeenCalled();
  });
});
