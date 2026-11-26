import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  startTestServer,
  TestClient,
  type TestServer,
  cleanupTestUploads,
} from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertAdmin, resetTestDb, testDb } from "../helpers/testDb.ts";
import {
  rebuildDuplicateIndex,
  resetDuplicateIndex,
} from "../../src/modules/duplicates/indexLifecycle.ts";
import { publishRequestProjection } from "../../src/modules/duplicates/projection.ts";
import { toSaoPauloQuarter } from "../../src/modules/duplicates/template.ts";
import type { DemandBlock } from "../../src/shared/types/requests.ts";
import type { CreateRequestPayload } from "../../src/modules/DTOs/requests/RequestRequests.dto.ts";
import type { CreateRequestResponse } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEMAND: DemandBlock = {
  title: "Automatizar conciliação bancária",
  requestType: "Automação",
  category: "Automação",
  processName: "Conciliação bancária mensal",
  description: "Conferência manual de extratos e lançamentos.",
  problem: "Retrabalho e risco de divergência no fechamento.",
  expectedResult: "Conciliação automática com trilha de conferência.",
  justification: "Reduzir esforço manual do time financeiro.",
};

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(async () => {
  await resetTestDb();
  resetDuplicateIndex();
  await testDb("system_settings")
    .where({ settings_id: 1 })
    .update({ duplicate_detection_enabled: true });
});

afterAll(async () => {
  resetDuplicateIndex();
  await server.close();
  await cleanupTestUploads();
  await closeTestDb();
});

async function createRequest(payload: CreateRequestPayload): Promise<CreateRequestResponse> {
  const client = new TestClient(server.baseUrl);
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));

  const response = await client.request<CreateRequestResponse>("POST", "/requests", {
    rawBody: form,
  });

  expect(response.status).toBe(201);
  return response.body;
}

async function requestRow(protocol: string) {
  const row = await testDb("requests").where({ protocol }).first();
  if (!row) throw new Error(`Solicitação não encontrada: ${protocol}`);
  return row;
}

async function projectionRow(protocol: string) {
  const request = await requestRow(protocol);
  return testDb("request_public_projections").where({ request_id: request.request_id }).first();
}

async function checkDuplicates(demand: DemandBlock) {
  await rebuildDuplicateIndex();
  const client = new TestClient(server.baseUrl);
  const response = await client.post("/requests/duplicates/check", { demand });
  expect(response.status).toBe(200);
  return response.body as { confidence: string; items: Record<string, unknown>[] };
}

async function setStatusAndPublish(protocol: string, statusId: number): Promise<void> {
  const request = await requestRow(protocol);
  await testDb("requests")
    .where({ request_id: request.request_id })
    .update({ status_id: statusId });
  await testDb.transaction((trx) => publishRequestProjection(trx, request.request_id));
}

async function loginAdmin(client: TestClient): Promise<void> {
  await insertAdmin({ email: "admin@neo.com" });
  const login = await client.post("/auth/login", {
    email: "admin@neo.com",
    password: "SenhaTeste@123",
  });
  expect(login.status).toBe(200);
}

describe("DB — projeção pública e Alerta de duplicidade", () => {
  it("cria a projeção com template e public_id independente do protocolo", async () => {
    const created = await createRequest(makeRequestPayload());
    const request = await requestRow(created.protocol);
    const projection = await projectionRow(created.protocol);
    const period = toSaoPauloQuarter(request.created_at);

    expect(projection).toMatchObject({
      publication_status: "published",
      is_publicly_listable: true,
      public_title: "Solicitação de Automação em andamento",
      public_summary: `Solicitação em andamento da categoria Automação, registrada no período ${period}.`,
      public_category: "Automação",
      public_status: "Em andamento",
      redaction_version: "v1-open-template",
      version: 1,
      suppressed_at: null,
      suppression_reason: null,
    });
    expect(projection.public_id).toMatch(UUID_PATTERN);
    expect(projection.public_id).not.toBe(created.protocol);
    expect(projection.public_period).toBe(toSaoPauloQuarter(request.created_at));
    expect(projection.published_at).toBeTruthy();
  });

  it("abertas elegíveis aparecem com exatamente seis chaves e sem protocolo", async () => {
    const created = await createRequest(makeRequestPayload());
    const projection = await projectionRow(created.protocol);

    const body = await checkDuplicates(DEMAND);

    expect(body.confidence).toBe("high");
    expect(body.items).toHaveLength(1);
    expect(Object.keys(body.items[0] ?? {}).sort()).toEqual([
      "category",
      "period",
      "publicId",
      "status",
      "summary",
      "title",
    ]);
    expect(body.items[0]).toEqual({
      publicId: projection.public_id,
      title: projection.public_title,
      summary: projection.public_summary,
      category: projection.public_category,
      status: projection.public_status,
      period: projection.public_period,
    });
    expect(JSON.stringify(body)).not.toContain(created.protocol);
  });

  it("dois templates iguais produzem confiança média", async () => {
    await createRequest(makeRequestPayload());
    await createRequest(makeRequestPayload());

    const body = await checkDuplicates(DEMAND);

    expect(body.confidence).toBe("medium");
    expect(body.items).toHaveLength(2);
  });

  it("termo sem correspondência retorna none com lista vazia", async () => {
    await createRequest(makeRequestPayload());

    const unmatched: DemandBlock = {
      title: "xilofone",
      requestType: "xilofone",
      category: "xilofone",
      processName: "xilofone",
      description: "xilofone",
      problem: "xilofone",
      expectedResult: "xilofone",
      justification: "xilofone",
    };
    const body = await checkDuplicates(unmatched);

    expect(body).toEqual({ confidence: "none", items: [] });
  });

  it("exclui restritas, desfechos inelegíveis e allowlists desligadas", async () => {
    const restrictedPayload = makeRequestPayload();
    restrictedPayload.complementary = {
      ...restrictedPayload.complementary,
      handlesRestrictedInfo: "Contém dados financeiros sensíveis.",
    };
    const restricted = await createRequest(restrictedPayload);

    const statusCases = [
      { statusId: 10, reason: "ineligible_status" },
      { statusId: 13, reason: "ineligible_status" },
      // O 16 é terminal, mas é elegível desde a #210; sem `concluded_at`, a
      // linha cai em `missing_concluded_at` (e não em `terminal_status`).
      { statusId: 16, reason: "missing_concluded_at" },
      { statusId: 17, reason: "terminal_status" },
    ] as const;

    const createdByStatus: Array<{ protocol: string; reason: string }> = [];
    for (const testCase of statusCases) {
      const created = await createRequest(makeRequestPayload());
      await setStatusAndPublish(created.protocol, testCase.statusId);
      createdByStatus.push({ protocol: created.protocol, reason: testCase.reason });
    }

    const categoryDisabled = makeRequestPayload();
    categoryDisabled.demand.category = "Melhoria de processo";
    const disabledCategory = await createRequest(categoryDisabled);
    await testDb("categories")
      .where({ name: "Melhoria de processo" })
      .update({ is_publicly_listable: false });
    await testDb.transaction(async (trx) => {
      const request = await requestRow(disabledCategory.protocol);
      await publishRequestProjection(trx, request.request_id);
    });

    const statusDisabled = await createRequest(makeRequestPayload());
    await testDb("statuses")
      .where({ status_id: 5 })
      .update({ is_duplicate_corpus_eligible: false });
    await setStatusAndPublish(statusDisabled.protocol, 5);

    const body = await checkDuplicates(DEMAND);

    expect(body).toEqual({ confidence: "none", items: [] });

    await expect(projectionRow(restricted.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "restricted_request",
    });
    for (const item of createdByStatus) {
      await expect(projectionRow(item.protocol)).resolves.toMatchObject({
        publication_status: "suppressed",
        suppression_reason: item.reason,
      });
    }
    await expect(projectionRow(disabledCategory.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "ineligible_category",
    });
    await expect(projectionRow(statusDisabled.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "ineligible_status",
    });
  });

  it("status 19 (Duplicada) fica fora do corpus pela allowlist", async () => {
    // O catálogo atual do banco vai até o status 17; o 19 ("Duplicada") é
    // criado aqui para provar a allowlist prevista para a fatia.
    await testDb("statuses").insert({
      status_id: 19,
      order_number: 19,
      name: "Duplicada",
      description: "Solicitação duplicada de outra demanda",
      tone: "neutral",
      is_active: true,
      is_core: false,
      is_restricted: false,
      is_terminal: false,
      triage_mode: "none",
      mapping_mode: "none",
      is_public: false,
      is_duplicate_corpus_eligible: false,
    });

    let requestId: string | null = null;

    try {
      const created = await createRequest(makeRequestPayload());
      const request = await requestRow(created.protocol);
      requestId = request.request_id;
      await setStatusAndPublish(created.protocol, 19);

      const body = await checkDuplicates(DEMAND);

      expect(body).toEqual({ confidence: "none", items: [] });
      await expect(projectionRow(created.protocol)).resolves.toMatchObject({
        publication_status: "suppressed",
        suppression_reason: "ineligible_status",
      });
    } finally {
      if (requestId) {
        await testDb("requests").where({ request_id: requestId }).del();
      }
      await testDb("statuses").where({ status_id: 19 }).del();
    }
  });

  it("flag desligada e índice resetado degradam para 200 vazio", async () => {
    await createRequest(makeRequestPayload());
    expect((await checkDuplicates(DEMAND)).confidence).toBe("high");

    resetDuplicateIndex();
    const client = new TestClient(server.baseUrl);
    const resetResponse = await client.post("/requests/duplicates/check", { demand: DEMAND });
    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toEqual({ confidence: "none", items: [] });

    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ duplicate_detection_enabled: false });
    const disabled = await checkDuplicates(DEMAND);
    expect(disabled).toEqual({ confidence: "none", items: [] });
  });

  it("canário de RN04 não vaza texto livre, protocolo ou PII", async () => {
    const canary = "CANARIO-RN04-XILOFONE-4242";
    const cpf = "123.456.789-00";
    const payload = makeRequestPayload();
    payload.demand.title = `${canary} conciliação`;
    payload.demand.description = `Descrição interna ${canary} CPF ${cpf}`;
    payload.demand.problem = `Problema ${canary}`;
    payload.complementary = {
      ...payload.complementary,
      handlesRestrictedInfo: `Sigilo ${canary}`,
    };

    const consoleSpies = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];

    try {
      const created = await createRequest(payload);
      const projection = await projectionRow(created.protocol);
      const projectionJson = JSON.stringify(projection);

      expect(projectionJson).not.toContain(canary);
      expect(projectionJson).not.toContain(cpf);
      expect(projectionJson).not.toContain(created.protocol);
      expect(projection.suppression_reason).toBe("restricted_request");

      const body = await checkDuplicates({ ...DEMAND, title: canary, category: canary });
      const serialized = JSON.stringify(body);

      expect(serialized).not.toContain(canary);
      expect(serialized).not.toContain(cpf);
      expect(serialized).not.toContain(created.protocol);
      for (const spy of consoleSpies) {
        for (const call of spy.mock.calls) {
          expect(JSON.stringify(call)).not.toContain(canary);
          expect(JSON.stringify(call)).not.toContain(cpf);
        }
      }
    } finally {
      for (const spy of consoleSpies) spy.mockRestore();
    }
  });

  it("edição de prazo/restrição e religação de Status/Categoria atualizam a projeção", async () => {
    const created = await createRequest(makeRequestPayload());
    const client = new TestClient(server.baseUrl);
    await loginAdmin(client);

    const base = makeRequestPayload();
    const internalPayload = {
      requester: {
        area: base.requester.area,
        department: base.requester.department,
        manager: base.requester.manager,
        additionalContact: base.requester.additionalContact,
      },
      demand: base.demand,
      operational: base.operational,
      complementary: { ...base.complementary, handlesRestrictedInfo: "Sigilo interno" },
    };

    const restrict = await client.patch(`/requests/${created.protocol}/internal`, internalPayload);
    expect(restrict.status).toBe(200);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "restricted_request",
    });

    const release = await client.patch(`/requests/${created.protocol}/internal`, {
      ...internalPayload,
      complementary: { ...base.complementary, handlesRestrictedInfo: false },
    });
    expect(release.status).toBe(200);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      suppression_reason: null,
    });

    const toIneligible = await client.patch(`/requests/${created.protocol}/status`, {
      targetStatus: 10,
      justification: "Teste de supressão.",
    });
    expect(toIneligible.status).toBe(200);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "ineligible_status",
    });

    const backToOpen = await client.patch(`/requests/${created.protocol}/status`, {
      targetStatus: 1,
      justification: "Reabertura no teste.",
      lastTechnicalMessage: "Sua solicitação está em andamento.",
    });
    expect(backToOpen.status).toBe(200);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      suppression_reason: null,
    });

    await testDb("categories").where({ category_id: 1 }).update({ is_publicly_listable: false });
    await testDb.transaction(async (trx) => {
      const request = await requestRow(created.protocol);
      await publishRequestProjection(trx, request.request_id);
    });
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "ineligible_category",
    });

    await testDb("categories").where({ category_id: 1 }).update({ is_publicly_listable: true });
    await testDb.transaction(async (trx) => {
      const request = await requestRow(created.protocol);
      await publishRequestProjection(trx, request.request_id);
    });
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      suppression_reason: null,
    });
  });
});
