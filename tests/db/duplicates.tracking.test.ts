import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupTestUploads,
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";
import {
  rebuildDuplicateIndex,
  resetDuplicateIndex,
} from "../../src/modules/duplicates/indexLifecycle.ts";
import type { DuplicateCheckResponse } from "../../src/shared/types/duplicates.ts";
import type { CreateRequestPayload } from "../../src/modules/DTOs/requests/RequestRequests.dto.ts";
import type { CreateRequestResponse } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const PUBLIC_IDENTITY_HEADER = "x-requester-identity";
const OWNER_EMAIL = "maria@neo.com";
const OWNER_NAME = "Maria Solicitante";

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

async function setSolicitationMode(mode: "PUBLIC" | "AUTHENTICATED"): Promise<void> {
  await testDb("system_settings").where({ settings_id: 1 }).update({ solicitation_mode: mode });
}

async function login(client: TestClient, email: string): Promise<void> {
  const response = await client.post("/auth/login", {
    email,
    password: "SenhaTeste@123",
  });
  expect(response.status).toBe(200);
}

async function createRequest(
  payload: CreateRequestPayload,
  client = new TestClient(server.baseUrl),
): Promise<CreateRequestResponse> {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));

  const response = await client.request<CreateRequestResponse>("POST", "/requests", {
    rawBody: form,
  });

  expect(response.status).toBe(201);
  return response.body;
}

async function publicIdFor(protocol: string): Promise<string> {
  const request = await testDb("requests").where({ protocol }).first();
  if (!request) throw new Error(`Solicitação não encontrada: ${protocol}`);

  const projection = await testDb("request_public_projections")
    .where({ request_id: request.request_id })
    .first();
  if (!projection) throw new Error(`Projeção não encontrada: ${protocol}`);

  return projection.public_id;
}

async function getDuplicates(
  protocol: string,
  headers: Record<string, string> = {},
  client = new TestClient(server.baseUrl),
): Promise<DuplicateCheckResponse> {
  await rebuildDuplicateIndex();
  const response = await client.get<DuplicateCheckResponse>(
    `/requests/${protocol}/duplicates`,
    headers,
  );

  expect(response.status).toBe(200);
  return response.body;
}

describe("DB — GET /requests/:protocol/duplicates (issue #211)", () => {
  it("sessão do dono devolve a seção sem a própria Solicitação", async () => {
    const owner = await insertUser({
      fullName: OWNER_NAME,
      email: OWNER_EMAIL,
      profileName: "solicitante",
    });
    await setSolicitationMode("AUTHENTICATED");

    const client = new TestClient(server.baseUrl);
    await login(client, owner.email);

    const own = await createRequest(makeRequestPayload(), client);
    const related = await createRequest(makeRequestPayload(), client);

    const body = await getDuplicates(own.protocol, {}, client);
    const ownPublicId = await publicIdFor(own.protocol);
    const relatedPublicId = await publicIdFor(related.protocol);

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ publicId: relatedPublicId });
    expect(body.items[0]?.publicId).not.toBe(ownPublicId);
    expect(Object.keys(body.items[0] ?? {}).sort()).toEqual([
      "category",
      "period",
      "publicId",
      "status",
      "summary",
      "title",
    ]);
    expect(JSON.stringify(body)).not.toContain(own.protocol);
  });

  it("identidade pública válida devolve a seção; ausente ou divergente usa o erro genérico do Acompanhamento", async () => {
    await setSolicitationMode("PUBLIC");

    const own = await createRequest(makeRequestPayload());
    const related = await createRequest(makeRequestPayload());
    const relatedPublicId = await publicIdFor(related.protocol);

    const identity = JSON.stringify({ name: OWNER_NAME, email: OWNER_EMAIL });
    const body = await getDuplicates(own.protocol, { [PUBLIC_IDENTITY_HEADER]: identity });

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ publicId: relatedPublicId });

    const missing = new TestClient(server.baseUrl);
    const missingDuplicates = await missing.get(`/requests/${own.protocol}/duplicates`);
    const missingTracking = await missing.get(`/requests/${own.protocol}/tracking`);

    expectErrorEnvelope(missingDuplicates, { statusCode: 401 });
    expectErrorEnvelope(missingTracking, { statusCode: 401 });
    expect(missingDuplicates.body).toEqual(missingTracking.body);

    const divergent = new TestClient(server.baseUrl);
    const divergentDuplicates = await divergent.get(`/requests/${own.protocol}/duplicates`, {
      [PUBLIC_IDENTITY_HEADER]: JSON.stringify({ name: OWNER_NAME, email: "outra@neo.com" }),
    });
    const divergentTracking = await divergent.get(`/requests/${own.protocol}/tracking`, {
      [PUBLIC_IDENTITY_HEADER]: JSON.stringify({ name: OWNER_NAME, email: "outra@neo.com" }),
    });

    expectErrorEnvelope(divergentDuplicates, { statusCode: 401 });
    expect(divergentDuplicates.body).toEqual(divergentTracking.body);
  });

  it("terceiro autenticado recebe 404 sem revelar a existência", async () => {
    const owner = await insertUser({
      fullName: OWNER_NAME,
      email: OWNER_EMAIL,
      profileName: "solicitante",
    });
    const thirdParty = await insertUser({
      fullName: "João Terceiro",
      email: "joao@neo.com",
      profileName: "solicitante",
    });
    await setSolicitationMode("AUTHENTICATED");

    const ownerClient = new TestClient(server.baseUrl);
    await login(ownerClient, owner.email);
    const own = await createRequest(makeRequestPayload(), ownerClient);

    const thirdPartyClient = new TestClient(server.baseUrl);
    await login(thirdPartyClient, thirdParty.email);

    const duplicates = await thirdPartyClient.get(`/requests/${own.protocol}/duplicates`);
    const tracking = await thirdPartyClient.get(`/requests/${own.protocol}/tracking`);

    expectErrorEnvelope(duplicates, { statusCode: 404 });
    expectErrorEnvelope(tracking, { statusCode: 404 });
    expect(duplicates.body).toEqual(tracking.body);
  });

  it("perfil interno recebe o mesmo 403 do Acompanhamento", async () => {
    await insertUser({ email: "analista@neo.com", profileName: "analista" });
    await setSolicitationMode("AUTHENTICATED");

    const client = new TestClient(server.baseUrl);
    await login(client, "analista@neo.com");

    const duplicates = await client.get("/requests/MAAT-AAAA-BBBB/duplicates");
    const tracking = await client.get("/requests/MAAT-AAAA-BBBB/tracking");

    expectErrorEnvelope(duplicates, { statusCode: 403 });
    expectErrorEnvelope(tracking, { statusCode: 403 });
    expect(duplicates.body).toEqual(tracking.body);
  });

  it("não devolve a própria Solicitação quando a projeção dela está suprimida", async () => {
    const owner = await insertUser({
      fullName: OWNER_NAME,
      email: OWNER_EMAIL,
      profileName: "solicitante",
    });
    await setSolicitationMode("AUTHENTICATED");

    const client = new TestClient(server.baseUrl);
    await login(client, owner.email);

    const restrictedPayload = makeRequestPayload();
    restrictedPayload.complementary = {
      ...restrictedPayload.complementary,
      handlesRestrictedInfo: "Contém dados financeiros sensíveis.",
    };
    const own = await createRequest(restrictedPayload, client);
    await createRequest(makeRequestPayload(), client);

    const request = await testDb("requests").where({ protocol: own.protocol }).first();
    await expect(
      testDb("request_public_projections").where({ request_id: request?.request_id }).first(),
    ).resolves.toMatchObject({
      publication_status: "suppressed",
      suppression_reason: "restricted_request",
    });

    const body = await getDuplicates(own.protocol, {}, client);

    expect(body).toEqual({ confidence: "none", items: [] });
  });

  it("flag desligada devolve lista vazia mesmo para o dono", async () => {
    const owner = await insertUser({
      fullName: OWNER_NAME,
      email: OWNER_EMAIL,
      profileName: "solicitante",
    });
    await setSolicitationMode("AUTHENTICATED");

    const client = new TestClient(server.baseUrl);
    await login(client, owner.email);

    const own = await createRequest(makeRequestPayload(), client);
    await createRequest(makeRequestPayload(), client);

    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ duplicate_detection_enabled: false });

    const body = await getDuplicates(own.protocol, {}, client);

    expect(body).toEqual({ confidence: "none", items: [] });
  });
});
