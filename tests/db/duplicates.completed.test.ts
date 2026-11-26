import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupTestUploads,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertAdmin, resetTestDb, testDb } from "../helpers/testDb.ts";
import {
  rebuildDuplicateIndex,
  resetDuplicateIndex,
} from "../../src/modules/duplicates/indexLifecycle.ts";
import { getDuplicateCompletedWindow } from "../../src/modules/duplicates/duplicates.repository.ts";
import { parseDuplicateCompletedWindow } from "../../src/modules/duplicates/completedWindow.ts";
import { publishRequestProjection } from "../../src/modules/duplicates/projection.ts";
import { toSaoPauloQuarter } from "../../src/modules/duplicates/template.ts";
import { updateStatusById } from "../../src/modules/requests/requests.repository.ts";
import type { DemandBlock } from "../../src/shared/types/requests.ts";
import type { CreateRequestPayload } from "../../src/modules/DTOs/requests/RequestRequests.dto.ts";
import type { CreateRequestResponse } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";

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

async function createRequest(payload: CreateRequestPayload = makeRequestPayload()) {
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

async function loginAdmin(client: TestClient): Promise<void> {
  const existing = await testDb("users").where({ email: "admin@neo.com" }).first("user_id");
  if (!existing) {
    await insertAdmin({ email: "admin@neo.com" });
  }
  const login = await client.post("/auth/login", {
    email: "admin@neo.com",
    password: "SenhaTeste@123",
  });
  expect(login.status).toBe(200);
}

async function concludeByPatch(protocol: string): Promise<void> {
  const client = new TestClient(server.baseUrl);
  await loginAdmin(client);

  const response = await client.patch(`/requests/${protocol}/status`, {
    targetStatus: 16,
    justification: "Demanda atendida.",
    lastTechnicalMessage: "Sua solicitação foi concluída.",
  });

  expect(response.status).toBe(200);
}

async function backdateConclusion(protocol: string, monthsAgo: number): Promise<void> {
  const request = await requestRow(protocol);
  await testDb("requests")
    .where({ request_id: request.request_id })
    .update({
      concluded_at: testDb.raw("now() - make_interval(months => ?)", [monthsAgo]),
    });
}

async function publishWithWindow(protocol: string, months: number): Promise<void> {
  const window = parseDuplicateCompletedWindow(months);
  if (!window) throw new Error(`Janela inválida no teste: ${months}`);

  const request = await requestRow(protocol);
  await testDb.transaction(async (trx) => {
    await trx("system_settings")
      .where({ settings_id: 1 })
      .update({ duplicate_completed_window_months: months });
    await publishRequestProjection(trx, request.request_id, window);
  });
}

async function checkDuplicates(demand: DemandBlock) {
  await rebuildDuplicateIndex();
  const client = new TestClient(server.baseUrl);
  const response = await client.post("/requests/duplicates/check", { demand });
  expect(response.status).toBe(200);
  return response.body as { confidence: string; items: Record<string, unknown>[] };
}

describe("DB — concluídas com texto tarjado e janela", () => {
  it("usa a janela padrão 3 quando o singleton está ausente", async () => {
    await testDb("system_settings").del();

    const onFallback = vi.fn();

    await expect(getDuplicateCompletedWindow({ onFallback })).resolves.toEqual({
      months: 3,
    });
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it("conclusão via PATCH grava concluded_at e publica título/resumo tarjados", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);

    const request = await requestRow(created.protocol);
    const projection = await projectionRow(created.protocol);

    expect(request.status_id).toBe(16);
    expect(request.concluded_at).toBeInstanceOf(Date);
    expect(projection).toMatchObject({
      publication_status: "published",
      is_publicly_listable: true,
      public_title: "Automatizar conciliação",
      public_summary:
        "Descrição detalhada do processo e do problema.\n\nProcesso manual e sujeito a erros.",
      public_category: "Automação",
      public_status: "Concluída",
      redaction_version: "v1-regex",
      suppression_reason: null,
    });
    expect(projection.public_concluded_at).toBeInstanceOf(Date);
    expect(projection.public_period).toBe(toSaoPauloQuarter(request.created_at));

    const body = await checkDuplicates(DEMAND);
    expect(body.items).toContainEqual({
      publicId: projection.public_id,
      title: projection.public_title,
      summary: projection.public_summary,
      category: "Automação",
      status: "Concluída",
      period: projection.public_period,
    });
    expect(JSON.stringify(body)).not.toContain(created.protocol);
  });

  it("conclusão via POST de triagem grava concluded_at e republica a projeção", async () => {
    const created = await createRequest();
    const client = new TestClient(server.baseUrl);
    await loginAdmin(client);

    const triage = await client.post(`/requests/${created.protocol}/triage`, {
      adherentToScope: "Sim",
      adherentJustification: "",
      changeCategory: "Não",
      newCategory: "",
      preliminaryComplexity: "Baixa",
      perceivedRisks: "Nenhum risco relevante.",
      suggestedResponsible: "",
      suggestedResponsibleJustification: "",
      exitStatus: 16,
      result: "Demanda atendida.",
      conclusionJustification: "Conclusão da triagem.",
      lastTechnicalMessage: "Sua solicitação foi concluída.",
    });

    expect(triage.status).toBe(201);

    const request = await requestRow(created.protocol);
    const projection = await projectionRow(created.protocol);

    expect(request.status_id).toBe(16);
    expect(request.concluded_at).toBeInstanceOf(Date);
    expect(projection).toMatchObject({
      publication_status: "published",
      public_title: "Automatizar conciliação",
      public_status: "Concluída",
      redaction_version: "v1-regex",
    });
    expect(projection.public_concluded_at).toBeInstanceOf(Date);
  });

  it("reabertura limpa concluded_at e volta ao template de aberta", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);

    const client = new TestClient(server.baseUrl);
    await loginAdmin(client);
    const reopen = await client.patch(`/requests/${created.protocol}/status`, {
      targetStatus: 1,
      justification: "Reabertura solicitada pelo solicitante.",
      lastTechnicalMessage: "Sua solicitação voltou para o fluxo.",
    });

    expect(reopen.status).toBe(200);

    const request = await requestRow(created.protocol);
    const projection = await projectionRow(created.protocol);
    const period = toSaoPauloQuarter(request.created_at);

    expect(request.status_id).toBe(1);
    expect(request.concluded_at).toBeNull();
    expect(projection).toMatchObject({
      publication_status: "published",
      public_title: "Solicitação de Automação em andamento",
      public_summary: `Solicitação em andamento da categoria Automação, registrada no período ${period}.`,
      public_status: "Em andamento",
      redaction_version: "v1-open-template",
      public_concluded_at: null,
      suppression_reason: null,
    });
  });

  it("reaplicar o Status 16 preserva concluded_at", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);

    const request = await requestRow(created.protocol);
    const original = new Date("2026-09-01T10:00:00.000Z");
    await testDb("requests")
      .where({ request_id: request.request_id })
      .update({ concluded_at: original });

    await testDb.transaction(async (trx) => {
      await updateStatusById(trx, request.request_id, 16, "admin@neo.com");
    });

    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      status_id: 16,
      concluded_at: original,
    });
  });

  it("reaplicar o Status 16 preenche concluded_at legado nulo", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);

    const request = await requestRow(created.protocol);
    await testDb("requests")
      .where({ request_id: request.request_id })
      .update({ concluded_at: null });

    await testDb.transaction(async (trx) => {
      await updateStatusById(trx, request.request_id, 16, "admin@neo.com");
    });

    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      status_id: 16,
      concluded_at: expect.any(Date),
    });
  });

  it("concluída fora da janela é suprimida com template", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);
    await backdateConclusion(created.protocol, 4);
    await publishWithWindow(created.protocol, 3);

    const projection = await projectionRow(created.protocol);

    expect(projection).toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
      public_title: "Solicitação de Automação concluída",
      public_summary: `Solicitação concluída da categoria Automação, registrada no período ${projection.public_period}.`,
      public_status: "Concluída",
      redaction_version: "v1-template",
    });
    expect(projection.public_concluded_at).toBeInstanceOf(Date);

    const body = await checkDuplicates(DEMAND);
    expect(body).toEqual({ confidence: "none", items: [] });
  });

  it("janela configurável 1/3/36 muda a elegibilidade da mesma conclusão", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);
    await backdateConclusion(created.protocol, 2);

    await publishWithWindow(created.protocol, 1);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
    });

    await publishWithWindow(created.protocol, 3);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      suppression_reason: null,
    });

    await backdateConclusion(created.protocol, 4);
    await publishWithWindow(created.protocol, 3);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
    });

    await publishWithWindow(created.protocol, 36);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "published",
      suppression_reason: null,
    });
  });

  it("reduzir a janela dispara a varredura no rebuild e remove do índice", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);
    await backdateConclusion(created.protocol, 2);
    await publishWithWindow(created.protocol, 36);

    expect((await checkDuplicates(DEMAND)).items).toHaveLength(1);

    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ duplicate_completed_window_months: 1 });
    await rebuildDuplicateIndex();

    const projection = await projectionRow(created.protocol);
    expect(projection).toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
      public_title: "Solicitação de Automação concluída",
      redaction_version: "v1-template",
    });
    expect((await checkDuplicates(DEMAND)).items).toHaveLength(0);
  });

  it("aumentar a janela reconcilia outside_window e regenera o texto tarjado", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);
    await backdateConclusion(created.protocol, 2);

    await publishWithWindow(created.protocol, 1);
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
      public_title: "Solicitação de Automação concluída",
    });

    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ duplicate_completed_window_months: 3 });
    await rebuildDuplicateIndex();

    const projection = await projectionRow(created.protocol);
    expect(projection).toMatchObject({
      publication_status: "published",
      suppression_reason: null,
      public_title: "Automatizar conciliação",
      public_summary:
        "Descrição detalhada do processo e do problema.\n\nProcesso manual e sujeito a erros.",
      public_status: "Concluída",
      redaction_version: "v1-regex",
    });

    const body = await checkDuplicates(DEMAND);
    expect(body.items).toContainEqual({
      publicId: projection.public_id,
      title: "Automatizar conciliação",
      summary:
        "Descrição detalhada do processo e do problema.\n\nProcesso manual e sujeito a erros.",
      category: "Automação",
      status: "Concluída",
      period: projection.public_period,
    });
  });

  it("reconciliação reavalia restrição e não republica a linha suprimida", async () => {
    const created = await createRequest();
    await concludeByPatch(created.protocol);
    await backdateConclusion(created.protocol, 2);
    await publishWithWindow(created.protocol, 1);

    const request = await requestRow(created.protocol);
    await testDb("requests")
      .where({ request_id: request.request_id })
      .update({ handles_restricted_info: true });
    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ duplicate_completed_window_months: 3 });
    await rebuildDuplicateIndex();

    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "restricted_request",
      public_title: "Solicitação de Automação concluída",
      redaction_version: "v1-template",
    });
    expect((await checkDuplicates(DEMAND)).items).toHaveLength(0);
  });

  it("restrição, Categoria desligada e Status 16 desligado suprimem com template", async () => {
    const restrictedPayload = makeRequestPayload();
    restrictedPayload.demand.title = "Título livre restrito";
    restrictedPayload.complementary = {
      ...restrictedPayload.complementary,
      handlesRestrictedInfo: "Contém informação sigilosa.",
    };
    const restricted = await createRequest(restrictedPayload);
    await concludeByPatch(restricted.protocol);
    await expect(projectionRow(restricted.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "restricted_request",
      public_title: "Solicitação de Automação concluída",
    });
    expect(JSON.stringify(await projectionRow(restricted.protocol))).not.toContain(
      "Título livre restrito",
    );

    const categoryDisabled = await createRequest();
    await testDb("categories").where({ name: "Automação" }).update({ is_publicly_listable: false });
    await concludeByPatch(categoryDisabled.protocol);
    await expect(projectionRow(categoryDisabled.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "ineligible_category",
      public_title: "Solicitação de Automação concluída",
    });

    await testDb("categories").where({ name: "Automação" }).update({ is_publicly_listable: true });

    const statusDisabled = await createRequest();
    await testDb("statuses")
      .where({ status_id: 16 })
      .update({ is_duplicate_corpus_eligible: false });
    await concludeByPatch(statusDisabled.protocol);
    await expect(projectionRow(statusDisabled.protocol)).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "ineligible_status",
      public_title: "Solicitação de Automação concluída",
    });
  });

  it("gate de PII cobre variantes espaçadas sem vazar no endpoint", async () => {
    const spacedCpf = "123 456 789 00";
    const spacedCnpj = "12 345 678/0001 90";
    const spacedCep = "01310 100";
    const payload = makeRequestPayload();
    payload.demand.title = `Conciliação para CPF ${spacedCpf}`;
    payload.demand.description = `Empresa ${spacedCnpj} no CEP ${spacedCep}.`;
    payload.demand.problem = "Processo manual.";

    const created = await createRequest(payload);
    await concludeByPatch(created.protocol);

    const projection = await projectionRow(created.protocol);
    const projectionJson = JSON.stringify(projection);

    expect(projection).toMatchObject({
      publication_status: "published",
      public_title: "Solicitação de Automação concluída",
      public_status: "Concluída",
    });
    expect(projectionJson).not.toContain(spacedCpf);
    expect(projectionJson).not.toContain(spacedCnpj);
    expect(projectionJson).not.toContain(spacedCep);

    const body = await checkDuplicates({
      ...DEMAND,
      title: `Conciliação ${spacedCpf}`,
      description: spacedCnpj,
      problem: spacedCep,
    });

    expect(JSON.stringify(body)).not.toContain(spacedCpf);
    expect(JSON.stringify(body)).not.toContain(spacedCnpj);
    expect(JSON.stringify(body)).not.toContain(spacedCep);
  });

  it("falha do gate de PII cai para o template sem vazar texto bruto", async () => {
    const canary = "CANARIO-PII-4242";
    const cpf = "123.456.789-00";
    const email = "financeiro@neo.com";
    const payload = makeRequestPayload();
    payload.demand.title = `${canary} conciliação com CPF ${cpf}`;
    payload.demand.description = `Contato pelo e-mail ${email}.`;
    payload.demand.problem = "Processo manual.";

    const created = await createRequest(payload);
    await concludeByPatch(created.protocol);

    const projection = await projectionRow(created.protocol);
    const projectionJson = JSON.stringify(projection);

    expect(projection).toMatchObject({
      publication_status: "published",
      public_title: "Solicitação de Automação concluída",
      public_summary: `Solicitação concluída da categoria Automação, registrada no período ${projection.public_period}.`,
      public_status: "Concluída",
      redaction_version: "v1-template",
    });
    expect(projectionJson).not.toContain(canary);
    expect(projectionJson).not.toContain(cpf);
    expect(projectionJson).not.toContain(email);

    const leaked = await checkDuplicates({
      ...DEMAND,
      title: `${canary} conciliação`,
      description: cpf,
      problem: email,
    });
    const serialized = JSON.stringify(leaked);

    expect(serialized).not.toContain(canary);
    expect(serialized).not.toContain(cpf);
    expect(serialized).not.toContain(email);

    const templateDemand: DemandBlock = {
      ...DEMAND,
      title: "Solicitação de Automação concluída",
      processName: "Automação",
      description: "Solicitação concluída da categoria Automação.",
      problem: "Demanda atendida.",
    };
    const body = await checkDuplicates(templateDemand);

    expect(body.items[0]).toMatchObject({ title: "Solicitação de Automação concluída" });
  });
});
