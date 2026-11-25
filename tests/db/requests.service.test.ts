import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const requestsService = await import("../../src/modules/requests/requests.service.ts");

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe("requests.service (Postgres real)", () => {
  it("persiste a solicitação, o requester e as preferências de horário", async () => {
    const response = await requestsService.registerRequest(makeRequestPayload(), []);

    expect(response.protocol).toMatch(/^MAAT-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(response.status).toBe("Solicitação enviada");

    const request = await testDb("requests").where({ protocol: response.protocol }).first();
    expect(request).toMatchObject({
      title: "Automatizar conciliação",
      process_name: "Conciliação bancária",
      operational_impact: "Médio",
    });
    expect(request.requester_user_id).toBeNull();

    const requester = await testDb("requesters")
      .where({ requester_id: request.requester_id })
      .first();
    expect(requester).toMatchObject({
      full_name: "Maria Solicitante",
      corporate_email: "maria@neo.com",
      area: "Financeiro",
    });

    const preferences = await testDb("request_time_preferences").where({
      request_id: request.request_id,
    });
    expect(preferences).toHaveLength(2);
  });

  it("persiste anexos vinculados à solicitação", async () => {
    const response = await requestsService.registerRequest(makeRequestPayload(), [
      {
        fileName: "documento.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1234,
        storageKey: "documento.pdf",
        storagePath: "/tmp/nao-existe/documento.pdf",
      },
    ]);

    const request = await testDb("requests").where({ protocol: response.protocol }).first();
    const attachments = await testDb("attachments").where({ request_id: request.request_id });

    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      file_name: "documento.pdf",
      file_path: "documento.pdf",
      content_type: "application/pdf",
      uploaded_by: "maria@neo.com",
    });
  });

  it("usa a identidade do cadastro no modo autenticado (anti-spoofing)", async () => {
    const user = await insertUser({
      fullName: "Maria do Cadastro",
      email: "cadastro@neo.com",
      profileName: "solicitante",
    });

    const payload = makeRequestPayload();
    payload.requester.fullName = "Nome Falso";
    payload.requester.corporateEmail = "falso@neo.com";

    const response = await requestsService.registerRequest(payload, [], user.user_id);
    const request = await testDb("requests").where({ protocol: response.protocol }).first();
    const requester = await testDb("requesters")
      .where({ requester_id: request.requester_id })
      .first();

    expect(request.requester_user_id).toBe(user.user_id);
    expect(requester).toMatchObject({
      full_name: "Maria do Cadastro",
      corporate_email: "cadastro@neo.com",
    });
  });

  it("lista solicitações reais por e-mail", async () => {
    await requestsService.registerRequest(makeRequestPayload(), []);

    const page = await requestsService.listRequestsByEmail({
      email: "maria@neo.com",
      page: 1,
      pageSize: 10,
    });

    expect(page.total).toBe(1);
    expect(page.data[0]).toMatchObject({
      processName: "Conciliação bancária",
      requesterName: "Maria Solicitante",
      status: "Solicitação enviada",
    });
  });

  it("não grava solicitação quando a categoria não existe", async () => {
    const payload = makeRequestPayload();
    payload.demand.category = "Categoria inexistente";

    await expect(requestsService.registerRequest(payload, [])).rejects.toMatchObject({
      statusCode: 400,
    });

    await expect(testDb("requests")).resolves.toHaveLength(0);
  });
});
