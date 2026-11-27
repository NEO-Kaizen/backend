import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { BASE_PROFILES } from "../../src/shared/catalog/baseProfiles.ts";
import {
  makeAuthState,
  makeCreateRequestResponse,
  makeRequestPayload,
  makeToken,
  makeTrackingResponse,
} from "../helpers/factories.ts";
import type { RequestDetail } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";
import {
  cleanupTestUploads,
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";

// Contrato HTTP e upload com o service mockado. A persistência real (service +
// Postgres + anexos) está em `tests/db/requests.service.test.ts` e
// `tests/db/requests.http.test.ts`.
vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
  listUserPermissions: vi.fn(),
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

function permissionRowsFor(profileLabel: string) {
  const profile = BASE_PROFILES.find(
    (candidate) => candidate.profileName.toLowerCase() === profileLabel.toLowerCase(),
  );

  return (profile?.permissions ?? []).map(({ key, custody }) => ({
    permission_key: key,
    custody,
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  // Sessões destes testes são do Perfil Analista: as chaves internas usadas
  // pelas rotas (request:write, request:status_change) vêm da matriz real.
  vi.mocked(authRepository.listUserPermissions).mockResolvedValue(permissionRowsFor("Analista"));
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(async () => {
  await server.close();
  await cleanupTestUploads();
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

describe("E2E — POST /requests (multipart: validação do payload)", () => {
  it("exige a parte multipart 'payload'", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.request("POST", "/requests", { rawBody: new FormData() });
    expectErrorEnvelope(response, {
      statusCode: 400,
      message: "Parte 'payload' ausente no corpo da requisição.",
    });
  });

  it("rejeita payload com JSON inválido", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);
    const form = new FormData();
    form.append("payload", "{nao-e-json");

    const response = await client.request("POST", "/requests", { rawBody: form });
    expectErrorEnvelope(response, {
      statusCode: 400,
      message: "A parte 'payload' contém um JSON inválido.",
    });
  });

  it("rejeita payload sem os blocos obrigatórios (Zod)", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    const response = await client.request("POST", "/requests", {
      rawBody: formWithPayload({}),
    });
    expectErrorEnvelope(response, { statusCode: 400, message: /Campos obrigatórios ausentes/ });
  });

  it("cria a solicitação com payload válido (201) e devolve o DTO completo", async () => {
    publicMode();
    const created = makeCreateRequestResponse({ protocol: PROTOCOL });
    vi.mocked(service.registerRequest).mockResolvedValue(created);

    const client = new TestClient(server.baseUrl);
    const response = await client.request("POST", "/requests", {
      rawBody: formWithPayload(makeRequestPayload()),
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(service.registerRequest).toHaveBeenCalledOnce();
  });
});

describe("E2E — POST /requests (multipart real)", () => {
  it("processa anexo válido, grava os bytes e entrega os metadados ao service", async () => {
    publicMode();
    const created = makeCreateRequestResponse({ protocol: PROTOCOL });
    vi.mocked(service.registerRequest).mockResolvedValue(created);

    const client = new TestClient(server.baseUrl);
    const content = Buffer.from("%PDF-1.4 teste");
    const form = formWithPayload(makeRequestPayload());
    form.append("attachments", new File([content], "documento.pdf", { type: "application/pdf" }));

    const response = await client.request("POST", "/requests", { rawBody: form });

    expect(response.status).toBe(201);
    expect(service.registerRequest).toHaveBeenCalledOnce();

    const attachments = vi.mocked(service.registerRequest).mock.calls[0]?.[1];
    expect(attachments).toHaveLength(1);
    expect(attachments?.[0]).toMatchObject({
      fileName: "documento.pdf",
      mimeType: "application/pdf",
      sizeBytes: content.byteLength,
    });

    const storagePath = attachments?.[0]?.storagePath;
    expect(storagePath).toBeTruthy();
    await expect(readFile(storagePath!, "utf8")).resolves.toBe(content.toString("utf8"));
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

  it("rejeita extensão não permitida mesmo com MIME de PDF", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());
    form.append(
      "attachments",
      new File([Buffer.from("<script>alert(1)</script>")], "malicioso.html", {
        type: "application/pdf",
      }),
    );

    const response = await client.request("POST", "/requests", { rawBody: form });

    expectErrorEnvelope(response, {
      statusCode: 400,
      message: /Formato de arquivo não permitido/,
    });
    expect(service.registerRequest).not.toHaveBeenCalled();
  });

  it("aceita exatamente 5 anexos e a tabela de MIMEs permitidos", async () => {
    publicMode();
    vi.mocked(service.registerRequest).mockResolvedValue(makeCreateRequestResponse());
    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());
    const allowed = [
      ["documento.pdf", "application/pdf"],
      ["documento.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ["planilha.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      ["imagem.png", "image/png"],
      ["foto.jpg", "image/jpeg"],
    ] as const;

    for (const [name, type] of allowed) {
      form.append("attachments", new File([`conteudo-${name}`], name, { type }));
    }

    const response = await client.request("POST", "/requests", { rawBody: form });

    expect(response.status).toBe(201);
    const attachments = vi.mocked(service.registerRequest).mock.calls[0]?.[1];
    expect(attachments).toHaveLength(5);
    expect(attachments?.map((item) => item.fileName)).toEqual(allowed.map(([name]) => name));
  });

  it("aceita anexo de exatamente 10 MB", async () => {
    publicMode();
    vi.mocked(service.registerRequest).mockResolvedValue(makeCreateRequestResponse());
    const client = new TestClient(server.baseUrl);
    const form = formWithPayload(makeRequestPayload());
    const exactlyTenMb = Buffer.alloc(10 * 1024 * 1024);
    form.append("attachments", new File([exactlyTenMb], "limite.pdf", { type: "application/pdf" }));

    const response = await client.request("POST", "/requests", {
      rawBody: form,
      timeoutMs: 20_000,
    });

    expect(response.status).toBe(201);
    const attachments = vi.mocked(service.registerRequest).mock.calls[0]?.[1];
    expect(attachments?.[0]?.sizeBytes).toBe(10 * 1024 * 1024);
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

describe("E2E — modo AUTHENTICATED", () => {
  function authenticatedSession() {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState());
    return { cookie: `session_id=${makeToken()}` };
  }

  it("rejeita ?email e lista apenas pela identidade da sessão", async () => {
    const headers = authenticatedSession();
    const page = { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
    vi.mocked(service.listRequestsByEmail).mockResolvedValue(page);
    const client = new TestClient(server.baseUrl);

    const withEmail = await client.get("/requests?email=outra@neo.com", headers);
    expectErrorEnvelope(withEmail, {
      statusCode: 400,
      message: "O parâmetro 'email' não é aceito com sessão autenticada.",
    });
    expect(service.listRequestsByEmail).not.toHaveBeenCalled();

    const scoped = await client.get("/requests?page=1&pageSize=10", headers);
    expect(scoped.status).toBe(200);
    expect(scoped.body).toEqual(page);
    expect(service.listRequestsByEmail).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10 }),
      1,
    );
  });

  it("exige cookie no modo AUTHENTICATED", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");
    const client = new TestClient(server.baseUrl);

    expectErrorEnvelope(await client.get("/requests"), { statusCode: 401 });
    expectErrorEnvelope(await client.get(`/requests/${PROTOCOL}`), { statusCode: 401 });
  });

  it("passa a identidade da sessão ao consultar uma solicitação", async () => {
    const headers = authenticatedSession();
    const detail = { protocol: PROTOCOL } as RequestDetail;
    vi.mocked(service.findRequest).mockResolvedValue(detail);
    const client = new TestClient(server.baseUrl);

    const response = await client.get(`/requests/${PROTOCOL}`, headers);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(detail);
    expect(service.findRequest).toHaveBeenCalledWith(PROTOCOL, 1);
  });
});

describe("E2E — validação do PATCH interno", () => {
  it("devolve 422 com fields quando o payload está vazio", async () => {
    publicMode();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState());
    const client = new TestClient(server.baseUrl);

    const response = await client.request("PATCH", `/requests/${PROTOCOL}/internal`, {
      body: {},
      headers: { cookie: `session_id=${makeToken()}` },
    });

    expectErrorEnvelope(response, {
      statusCode: 422,
      fields: { requester: "Campo obrigatório." },
    });
    expect(service.updateInternalRequest).not.toHaveBeenCalled();
  });
});

describe("E2E — erro interno", () => {
  it("não vaza detalhe quando o service falha com erro não tratado", async () => {
    publicMode();
    vi.mocked(service.registerRequest).mockRejectedValue(new Error("detalhe interno sensível"));
    const client = new TestClient(server.baseUrl);

    const response = await client.request("POST", "/requests", {
      rawBody: formWithPayload(makeRequestPayload()),
    });

    expectErrorEnvelope(response, {
      statusCode: 500,
      message: "Erro interno do servidor",
    });
    expect(response.text).not.toContain("detalhe interno sensível");
  });
});

describe("E2E — rotas internas exigem sessão", () => {
  it("bloqueia consulta interna e troca de status sem autenticação", async () => {
    publicMode();
    const client = new TestClient(server.baseUrl);

    expectErrorEnvelope(await client.get(`/requests/${PROTOCOL}/internal`), { statusCode: 401 });
    expectErrorEnvelope(
      await client.patch(`/requests/${PROTOCOL}/status`, {
        targetStatus: 3,
        justification: "ok",
      }),
      { statusCode: 401 },
    );
  });

  it("valida o corpo da troca de status (400 sem justificativa)", async () => {
    publicMode();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState());
    const token = makeToken();
    const client = new TestClient(server.baseUrl);

    const response = await client.request("PATCH", `/requests/${PROTOCOL}/status`, {
      body: { targetStatus: 3 },
      headers: { cookie: `session_id=${token}` },
    });

    expectErrorEnvelope(response, { statusCode: 400 });
    expect(service.updateRequestStatus).not.toHaveBeenCalled();
  });
});
