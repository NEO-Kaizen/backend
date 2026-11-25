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

  it("reutiliza a extensão requester 1:1 do usuário autenticado", async () => {
    const user = await insertUser({
      fullName: "Maria do Cadastro",
      email: "cadastro@neo.com",
      profileName: "solicitante",
    });
    const [existing] = await testDb("requesters")
      .insert({
        user_id: user.user_id,
        full_name: "Maria do Cadastro",
        corporate_email: "cadastro@neo.com",
        area: "Área antiga",
        manager_name: "Gestor antigo",
      })
      .returning("*");

    const payload = makeRequestPayload();
    payload.requester.area = "Financeiro";
    payload.requester.manager = "Novo Gestor";
    payload.requester.department = "Contas a Pagar";
    payload.requester.additionalContact = "11999999999";

    const response = await requestsService.registerRequest(payload, [], user.user_id);
    const request = await testDb("requests").where({ protocol: response.protocol }).first();
    const requesters = await testDb("requesters").where({ user_id: user.user_id });

    expect(requesters).toHaveLength(1);
    expect(requesters[0]).toMatchObject({
      requester_id: existing.requester_id,
      area: "Financeiro",
      department: "Contas a Pagar",
      manager_name: "Novo Gestor",
      additional_contact: "11999999999",
      full_name: "Maria do Cadastro",
      corporate_email: "cadastro@neo.com",
    });
    expect(request.requester_id).toBe(existing.requester_id);
    expect(request.requester_user_id).toBe(user.user_id);
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
    await expect(testDb("requesters")).resolves.toHaveLength(0);
    await expect(testDb("request_time_preferences")).resolves.toHaveLength(0);
    await expect(testDb("attachments")).resolves.toHaveLength(0);
  });

  it("faz rollback de request, requester, preferências e anexos quando o anexo viola o CHECK", async () => {
    const payload = makeRequestPayload();

    await expect(
      requestsService.registerRequest(payload, [
        {
          fileName: "vazio.pdf",
          mimeType: "application/pdf",
          sizeBytes: 0, // CHECK size_bytes > 0 falha depois do INSERT da request
          storageKey: "vazio.pdf",
          storagePath: "/tmp/nao-existe/vazio.pdf",
        },
      ]),
    ).rejects.toThrow(/size_bytes|check constraint/i);

    await expect(testDb("requests")).resolves.toHaveLength(0);
    await expect(testDb("requesters")).resolves.toHaveLength(0);
    await expect(testDb("request_time_preferences")).resolves.toHaveLength(0);
    await expect(testDb("attachments")).resolves.toHaveLength(0);
  });

  it("rejeita status inexistente na listagem e filtra pelo status real", async () => {
    await requestsService.registerRequest(makeRequestPayload(), []);

    const filtered = await requestsService.listRequestsByEmail({
      email: "maria@neo.com",
      status: "Solicitação enviada",
      page: 1,
      pageSize: 10,
    });
    expect(filtered.total).toBe(1);

    await expect(
      requestsService.listRequestsByEmail({
        email: "maria@neo.com",
        status: "Status inexistente",
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejeita anexo com content_type fora da lista e com tamanho acima de 10 MB", async () => {
    const response = await requestsService.registerRequest(makeRequestPayload(), []);
    const request = await testDb("requests").where({ protocol: response.protocol }).first();

    await expect(
      testDb("attachments").insert({
        request_id: request.request_id,
        file_name: "nota.pdf",
        file_path: "nota.pdf",
        content_type: "text/plain",
        size_bytes: 10,
      }),
    ).rejects.toThrow(/ck_attachments_content_type|check constraint/i);

    await expect(
      testDb("attachments").insert({
        request_id: request.request_id,
        file_name: "grande.pdf",
        file_path: "grande.pdf",
        content_type: "application/pdf",
        size_bytes: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow(/ck_attachments_size_bytes|check constraint/i);
  });
});
