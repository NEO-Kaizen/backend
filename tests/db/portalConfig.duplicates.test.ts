import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupTestUploads,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertAdmin, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";
import type { DemandBlock } from "../../src/shared/types/requests.ts";
import { STATUS_IDS } from "../../src/shared/types/status.ts";
import {
  rebuildDuplicateIndex,
  resetDuplicateIndex,
} from "../../src/modules/duplicates/indexLifecycle.ts";
import type { CreateRequestResponse } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";
import type { PortalCategory, PortalStatus } from "../../src/shared/types/portalConfig.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const DEMAND: DemandBlock = {
  title: "Automatizar conciliação",
  requestType: "Automação",
  category: "Automação",
  processName: "Conciliação bancária",
  description: "Descrição detalhada do processo e do problema.",
  problem: "Processo manual e sujeito a erros.",
  expectedResult: "Conciliação automática diária.",
  justification: "Reduzir esforço manual e erros.",
};

// Status elegível não-core do seed (o 1 é core e imutável).
const NON_CORE_ELIGIBLE_STATUS_ID = 9;

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

async function loginAdmin(): Promise<TestClient> {
  const client = new TestClient(server.baseUrl);
  const existing = await testDb("users").where({ email: "admin@neo.com" }).first();
  if (!existing) await insertAdmin({ email: "admin@neo.com" });
  const login = await client.post("/auth/login", {
    email: "admin@neo.com",
    password: "SenhaTeste@123",
  });
  expect(login.status).toBe(200);
  return client;
}

async function adminUserId(): Promise<number> {
  const admin = await testDb("users").where({ email: "admin@neo.com" }).first();
  if (!admin) throw new Error("Administrador de teste não encontrado.");
  return admin.user_id;
}

async function createRequest(): Promise<CreateRequestResponse> {
  const client = new TestClient(server.baseUrl);
  const form = new FormData();
  form.append("payload", JSON.stringify(makeRequestPayload()));
  const response = await client.request<CreateRequestResponse>("POST", "/requests", {
    rawBody: form,
  });
  expect(response.status, response.text).toBe(201);
  return response.body;
}

/** Transição pela rota HTTP — a projeção é publicada pela própria transição. */
async function changeRequestStatus(protocol: string, targetStatus: number): Promise<void> {
  const client = await loginAdmin();
  const response = await client.patch(`/requests/${protocol}/status`, {
    targetStatus,
    justification: "Teste de administração da detecção de duplicidade.",
    ...(targetStatus === STATUS_IDS.completed
      ? { lastTechnicalMessage: "Solicitação concluída." }
      : {}),
  });
  expect(response.status).toBe(200);
}

async function projection(protocol: string) {
  const request = await testDb("requests").where({ protocol }).first();
  if (!request) throw new Error(`Solicitação não encontrada: ${protocol}`);
  return testDb("request_public_projections").where({ request_id: request.request_id }).first();
}

async function categoriesPayload(): Promise<PortalCategory[]> {
  const rows = await testDb("categories").orderBy("display_order", "asc");
  return rows.map((row) => ({
    id: row.category_id,
    name: row.name,
    description: row.description ?? "",
    isActive: row.status === "active",
    isPubliclyListable: row.is_publicly_listable,
  }));
}

async function statusesPayload(): Promise<PortalStatus[]> {
  const rows = await testDb("statuses").orderBy("order_number", "asc");
  return rows.map((row) => ({
    id: row.status_id,
    name: row.name,
    isCore: row.is_core,
    isPublic: row.is_public,
    isTerminal: row.is_terminal,
    triageMode: row.triage_mode,
    mappingMode: row.mapping_mode,
    isRestricted: row.is_restricted,
    tone: row.tone,
    isActive: row.is_active,
    isDuplicateCorpusEligible: row.is_duplicate_corpus_eligible,
  }));
}

async function patchAsAdmin<T = unknown>(path: string, body: unknown) {
  const client = await loginAdmin();
  return client.patch<T>(path, body);
}

async function auditEntries() {
  return testDb("audit_history")
    .where({ entity_type: "settings", action_type: "settings.update" })
    .orderBy("audit_id", "asc");
}

describe("DB — administração da detecção de duplicidade (RF16 #212)", () => {
  it("PATCH /portal-config/duplicates persiste flag e janela e audita com chaves comparáveis", async () => {
    const response = await patchAsAdmin<{ enabled: boolean; completedWindowMonths: number }>(
      "/portal-config/duplicates",
      { enabled: false, completedWindowMonths: 12 },
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ enabled: false, completedWindowMonths: 12 });
    await expect(
      testDb("system_settings").where({ settings_id: 1 }).first(),
    ).resolves.toMatchObject({
      duplicate_detection_enabled: false,
      duplicate_completed_window_months: 12,
    });

    const [audit] = await auditEntries();
    expect(audit).toBeDefined();
    expect(audit.user_id).toBe(await adminUserId());
    expect(JSON.parse(audit.previous_value)).toEqual({
      enabled: true,
      completedWindowMonths: 3,
    });
    expect(JSON.parse(audit.new_value)).toEqual({
      enabled: false,
      completedWindowMonths: 12,
    });
    expect(Object.keys(JSON.parse(audit.previous_value)).sort()).toEqual(
      Object.keys(JSON.parse(audit.new_value)).sort(),
    );
  });

  it("rejeita janela fora de 1..36 e campos ausentes", async () => {
    for (const completedWindowMonths of [0, 37, 1.5]) {
      const response = await patchAsAdmin("/portal-config/duplicates", {
        enabled: true,
        completedWindowMonths,
      });
      expect(response.status).toBe(400);
    }

    const missing = await patchAsAdmin("/portal-config/duplicates", { enabled: true });
    expect(missing.status).toBe(400);

    await expect(
      testDb("system_settings").where({ settings_id: 1 }).first(),
    ).resolves.toMatchObject({
      duplicate_detection_enabled: true,
      duplicate_completed_window_months: 3,
    });
  });

  it("exige sessão de Administrador", async () => {
    const body = { enabled: false, completedWindowMonths: 6 };
    const anonymous = new TestClient(server.baseUrl);
    expect((await anonymous.patch("/portal-config/duplicates", body)).status).toBe(401);

    await insertUser({ email: "analista@neo.com" });
    const analyst = new TestClient(server.baseUrl);
    const login = await analyst.post("/auth/login", {
      email: "analista@neo.com",
      password: "SenhaTeste@123",
    });
    expect(login.status).toBe(200);
    expect((await analyst.patch("/portal-config/duplicates", body)).status).toBe(403);
  });

  it("desligar Categoria suprime a projeção e religar a republica com o mesmo public_id", async () => {
    const created = await createRequest();
    const before = await projection(created.protocol);
    expect(before).toMatchObject({
      publication_status: "published",
      is_publicly_listable: true,
      suppression_reason: null,
    });

    const disabled = await categoriesPayload();
    for (const category of disabled) category.isPubliclyListable = false;
    const off = await patchAsAdmin("/portal-config/categories", { categories: disabled });
    expect(off.status).toBe(200);

    const suppressed = await projection(created.protocol);
    expect(suppressed).toMatchObject({
      public_id: before.public_id,
      publication_status: "suppressed",
      is_publicly_listable: false,
      suppression_reason: "ineligible_category",
    });
    expect(suppressed.version).toBeGreaterThan(before.version);

    await rebuildDuplicateIndex();
    const client = new TestClient(server.baseUrl);
    const empty = await client.post("/requests/duplicates/check", { demand: DEMAND });
    expect(empty.status).toBe(200);
    expect(empty.body).toMatchObject({ confidence: "none", items: [] });

    const enabled = await categoriesPayload();
    for (const category of enabled) category.isPubliclyListable = true;
    const on = await patchAsAdmin("/portal-config/categories", { categories: enabled });
    expect(on.status).toBe(200);

    await expect(projection(created.protocol)).resolves.toMatchObject({
      public_id: before.public_id,
      publication_status: "published",
      is_publicly_listable: true,
      suppression_reason: null,
    });

    const [categoryAudit] = await auditEntries();
    expect(categoryAudit.user_id).toBe(await adminUserId());
    expect(JSON.parse(categoryAudit.previous_value)[0]).toHaveProperty("isPubliclyListable");
    expect(JSON.parse(categoryAudit.new_value)[0]).toHaveProperty("isPubliclyListable");
  });

  it("omitr uma Categoria antes listável a desliga da allowlist e suprime a projeção", async () => {
    const created = await createRequest();
    const categories = await categoriesPayload();
    const omitted = categories.find((category) => category.name === DEMAND.category);
    if (!omitted) throw new Error("Categoria da Solicitação não encontrada.");

    const response = await patchAsAdmin("/portal-config/categories", {
      categories: categories.filter((category) => category.id !== omitted.id),
    });
    expect(response.status).toBe(200);

    await expect(projection(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      is_publicly_listable: false,
      suppression_reason: "ineligible_category",
    });
    await expect(
      testDb("categories").where({ category_id: omitted.id }).first(),
    ).resolves.toMatchObject({ status: "inactive", is_publicly_listable: false });

    // O novo valor auditado reflete o estado pós-PATCH, incluindo o omitido.
    const [categoryAudit] = await auditEntries();
    const newValue = JSON.parse(categoryAudit.new_value) as PortalCategory[];
    expect(newValue.find((category) => category.id === omitted.id)).toMatchObject({
      isActive: false,
      isPubliclyListable: false,
    });
  });

  it("desligar Status elegível suprime a projeção e religar a republica", async () => {
    const created = await createRequest();
    await changeRequestStatus(created.protocol, NON_CORE_ELIGIBLE_STATUS_ID);
    expect(await projection(created.protocol)).toMatchObject({ publication_status: "published" });

    const statuses = await statusesPayload();
    const target = statuses.find((status) => status.id === NON_CORE_ELIGIBLE_STATUS_ID);
    if (!target) throw new Error("Status elegível não-core ausente no catálogo.");
    target.isDuplicateCorpusEligible = false;

    const off = await patchAsAdmin("/portal-config/statuses", { statuses });
    expect(off.status).toBe(200);
    await expect(projection(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      is_publicly_listable: false,
      suppression_reason: "ineligible_status",
    });

    const restored = await statusesPayload();
    const restoredTarget = restored.find((status) => status.id === NON_CORE_ELIGIBLE_STATUS_ID);
    if (!restoredTarget) throw new Error("Status elegível não-core ausente no catálogo.");
    restoredTarget.isDuplicateCorpusEligible = true;
    const on = await patchAsAdmin("/portal-config/statuses", { statuses: restored });
    expect(on.status).toBe(200);
    await expect(projection(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      is_publicly_listable: true,
      suppression_reason: null,
    });

    const [statusAudit] = await auditEntries();
    expect(statusAudit.user_id).toBe(await adminUserId());
    const previous = JSON.parse(statusAudit.previous_value) as PortalStatus[];
    const newValue = JSON.parse(statusAudit.new_value) as PortalStatus[];
    expect(previous.find((status) => status.id === NON_CORE_ELIGIBLE_STATUS_ID)).toMatchObject({
      isDuplicateCorpusEligible: true,
    });
    expect(newValue.find((status) => status.id === NON_CORE_ELIGIBLE_STATUS_ID)).toMatchObject({
      isDuplicateCorpusEligible: false,
    });
  });

  it("alterar isTerminal de Status não-core reavalia a projeção", async () => {
    const created = await createRequest();
    await changeRequestStatus(created.protocol, NON_CORE_ELIGIBLE_STATUS_ID);

    const statuses = await statusesPayload();
    const target = statuses.find((status) => status.id === NON_CORE_ELIGIBLE_STATUS_ID);
    if (!target) throw new Error("Status elegível não-core ausente no catálogo.");
    target.isTerminal = true;

    const response = await patchAsAdmin("/portal-config/statuses", { statuses });
    expect(response.status).toBe(200);
    await expect(projection(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "terminal_status",
    });
  });

  it("mantém imutável a elegibilidade do 16 (ligado) e do 17 (desligado)", async () => {
    const statuses = await statusesPayload();
    const completed = statuses.find((status) => status.id === STATUS_IDS.completed);
    const canceled = statuses.find((status) => status.id === STATUS_IDS.canceled);
    if (!completed || !canceled) throw new Error("Status de núcleo ausente no catálogo.");
    expect(completed.isDuplicateCorpusEligible).toBe(true);
    expect(canceled.isDuplicateCorpusEligible).toBe(false);

    completed.isDuplicateCorpusEligible = false;
    const off = await patchAsAdmin<{ code: string }>("/portal-config/statuses", { statuses });
    expect(off.status).toBe(409);
    expect(off.body.code).toBe("core_status_corpus_eligibility_locked");
    await expect(
      testDb("statuses").where({ status_id: STATUS_IDS.completed }).first(),
    ).resolves.toMatchObject({ is_duplicate_corpus_eligible: true });

    const restored = await statusesPayload();
    const canceled17 = restored.find((status) => status.id === STATUS_IDS.canceled);
    if (!canceled17) throw new Error("Status 17 ausente no catálogo.");
    canceled17.isDuplicateCorpusEligible = true;
    const on = await patchAsAdmin<{ code: string }>("/portal-config/statuses", {
      statuses: restored,
    });
    expect(on.status).toBe(409);
    expect(on.body.code).toBe("core_status_corpus_eligibility_locked");
    await expect(
      testDb("statuses").where({ status_id: STATUS_IDS.canceled }).first(),
    ).resolves.toMatchObject({ is_duplicate_corpus_eligible: false });
  });

  it("ampliar a janela pelo PATCH republica concluídas na varredura seguinte", async () => {
    const narrowed = await patchAsAdmin("/portal-config/duplicates", {
      enabled: true,
      completedWindowMonths: 1,
    });
    expect(narrowed.status).toBe(200);

    const created = await createRequest();
    await changeRequestStatus(created.protocol, STATUS_IDS.completed);
    // Fixture de tempo: a Solicitação foi concluída há 4 meses (fora da janela
    // de 1). `public_concluded_at` é snapshot usado pela varredura, então a
    // fixture atualiza as duas colunas — sem chamar o service diretamente.
    const concludedAt = new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000).toISOString();
    const request = await testDb("requests").where({ protocol: created.protocol }).first();
    await testDb("requests")
      .where({ request_id: request.request_id })
      .update({ concluded_at: concludedAt });
    await testDb("request_public_projections")
      .where({ request_id: request.request_id })
      .update({ public_concluded_at: concludedAt });
    await rebuildDuplicateIndex();
    await expect(projection(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
    });

    const widened = await patchAsAdmin("/portal-config/duplicates", {
      enabled: true,
      completedWindowMonths: 6,
    });
    expect(widened.status).toBe(200);
    await rebuildDuplicateIndex();

    await expect(projection(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      suppression_reason: null,
    });
  });

  it("com a flag desligada o check responde vazio mesmo com projeção publicada", async () => {
    await createRequest();
    const response = await patchAsAdmin("/portal-config/duplicates", {
      enabled: false,
      completedWindowMonths: 3,
    });
    expect(response.status).toBe(200);

    await rebuildDuplicateIndex();
    const client = new TestClient(server.baseUrl);
    const checked = await client.post("/requests/duplicates/check", { demand: DEMAND });
    expect(checked.status).toBe(200);
    expect(checked.body).toMatchObject({ confidence: "none", items: [] });
  });
});
