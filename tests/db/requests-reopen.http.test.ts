import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { STATUS_IDS } from "../../src/shared/types/status.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import {
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type HttpResult,
  type TestServer,
} from "../helpers/http.ts";
import {
  closeTestDb,
  DEFAULT_TEST_PASSWORD,
  failAuditWrites,
  insertAdmin,
  insertUser,
  resetTestDb,
  restoreAuditWrites,
  testDb,
} from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const { registerRequest } = await import("../../src/modules/requests/requests.service.ts");
let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
beforeEach(resetTestDb);
afterAll(async () => {
  await server.close();
  await closeTestDb();
});

async function login(email: string): Promise<TestClient> {
  const client = new TestClient(server.baseUrl);
  expect(
    (await client.post("/auth/login", { email, password: DEFAULT_TEST_PASSWORD })).status,
  ).toBe(200);
  return client;
}

async function fixture() {
  const user = await insertUser({ profileName: "solicitante", email: "titular@example.invalid" });
  const payload = makeRequestPayload();
  payload.requester.fullName = user.full_name;
  payload.requester.corporateEmail = user.email;
  const { protocol } = await registerRequest(payload, [], user.user_id);
  await requestRow(protocol).update({
    status_id: STATUS_IDS.completed,
    last_public_status_id: STATUS_IDS.completed,
  });
  return { user, protocol, client: await login(user.email) };
}

const requestRow = (protocol: string) => testDb("requests").where({ protocol });
const reopenEvents = (protocol: string) =>
  testDb("audit_history").where({
    entity_type: "request",
    entity_id: protocol,
    action_type: "request.reopen",
  });
const reopenPath = (protocol: string) => `/requests/${protocol}/reopen`;
const trackingPath = (protocol: string) => `/requests/${protocol}/tracking`;

async function getClosureRef(protocol: string): Promise<string> {
  const row = await requestRow(protocol).first("closure_ref");
  if (typeof row?.closure_ref !== "string") throw new Error("Fixture sem encerramento.");
  return row.closure_ref;
}

function expectError(response: HttpResult, statusCode: number, details: object = {}) {
  expect(response.status).toBe(statusCode);
  expectErrorEnvelope(response, { statusCode, message: /.+/ });
  expect(response.body).toMatchObject(details);
}

it("E01: exige sessão de Solicitante e titularidade direta, com 404 uniforme", async () => {
  const { protocol, user, client } = await fixture();
  const closureRef = await getClosureRef(protocol);
  const payload = { justification: "Reavaliar", closureRef };
  const anon = new TestClient(server.baseUrl);
  const admin = await login((await insertAdmin()).email);
  const analyst = await login((await insertUser({ email: "analista@example.invalid" })).email);
  const other = await login(
    (await insertUser({ profileName: "solicitante", email: "terceiro@example.invalid" })).email,
  );
  const identity = JSON.stringify({ name: user.full_name, email: user.email });

  expectError(await anon.post(reopenPath(protocol), payload), 401);
  expectError(
    await anon.post(reopenPath(protocol), payload, { "X-Requester-Identity": identity }),
    401,
  );
  expectError(
    await anon.request("POST", reopenPath(protocol), {
      body: payload,
      headers: { "X-Requester-Identity": identity, cookie: "session_id=invalido" },
    }),
    401,
  );
  for (const actor of [admin, analyst]) {
    expectError(await actor.post(reopenPath(protocol), payload), 403);
  }
  const missing = await client.post(reopenPath("INEXISTENTE"), payload);
  expectError(missing, 404);
  const unauthorized = await other.post(reopenPath(protocol), payload);
  expectError(unauthorized, 404);
  expect(unauthorized.body).toEqual(missing.body);

  const current = await client.get(trackingPath(protocol));
  expect(current.status).toBe(200);
  expect(current.body).toMatchObject({
    mode: "authenticated",
    details: { canReopen: true, closureRef },
  });
  await requestRow(protocol).update({ requester_user_id: null });
  const fallback = await client.get<{ details: Record<string, unknown> }>(trackingPath(protocol));
  expect(fallback.status).toBe(200);
  expect(fallback.body.details.canReopen).toBe(false);
  expect(fallback.body.details).not.toHaveProperty("closureRef");
  const withoutOwner = await client.post(reopenPath(protocol), payload);
  expectError(withoutOwner, 404);
  expect(withoutOwner.body).toEqual(missing.body);
  expect(await reopenEvents(protocol)).toHaveLength(0);
});

it("E01: revalida estado e referência mesmo após tracking elegível", async () => {
  const { protocol, client } = await fixture();
  const tracking = await client.get<{ details: { closureRef: string } }>(trackingPath(protocol));
  expect(tracking.status).toBe(200);
  const { closureRef } = tracking.body.details;
  const admin = await login((await insertAdmin()).email);
  const changed = await admin.request("PATCH", `/requests/${protocol}/status`, {
    body: {
      targetStatus: STATUS_IDS.canceled,
      justification: "Reclassificar",
      lastTechnicalMessage: "Cancelada.",
    },
  });
  expect(changed.status).toBe(200);
  expectError(
    await client.post(reopenPath(protocol), { justification: "Reavaliar", closureRef }),
    409,
    { code: "rf02_closure_conflict" },
  );
  expect(await reopenEvents(protocol)).toHaveLength(0);

  const current = await getClosureRef(protocol);
  expect(current).not.toBe(closureRef);
  const success = await client.post(reopenPath(protocol), {
    justification: "Reavaliar",
    closureRef: current,
  });
  expect(success.status).toBe(200);
  const active = await client.get<{ details: Record<string, unknown> }>(trackingPath(protocol));
  expect(active.body.details).toMatchObject({ canReopen: false, status: "Solicitação enviada" });
  expect(active.body.details).not.toHaveProperty("closureRef");
  expectError(
    await client.post(reopenPath(protocol), { justification: "Repetição", closureRef: current }),
    409,
    { code: "rf02_closure_conflict" },
  );
  expect(await reopenEvents(protocol)).toHaveLength(1);
});

it("E02: aplica validação estrita e os limites após trim com o envelope oficial", async () => {
  const { protocol, client } = await fixture();
  const closureRef = await getClosureRef(protocol);
  expectError(await client.post(reopenPath("%20%20"), { justification: "x", closureRef }), 400);

  for (const [body, field] of [
    [{}, "justification"],
    [{ justification: "", closureRef }, "justification"],
    [{ justification: "   ", closureRef }, "justification"],
    [{ justification: "a".repeat(4001), closureRef }, "justification"],
    [{ justification: 123, closureRef }, "justification"],
    [{ justification: "x" }, "closureRef"],
    [{ justification: "x", closureRef: "inválida" }, "closureRef"],
    [{ justification: "x", closureRef, targetStatus: 3 }, "payload"],
  ] as const) {
    expectError(await client.post(reopenPath(protocol), body), 422, {
      fields: { [field]: expect.any(String) },
    });
  }
  expect(await reopenEvents(protocol)).toHaveLength(0);
  const shortest = await client.post(reopenPath(protocol), { justification: " a ", closureRef });
  expect(shortest.status).toBe(200);
  expect(shortest.body).toEqual({ protocol, statusId: 1, status: "Solicitação enviada" });
  await requestRow(protocol).update({ status_id: STATUS_IDS.completed });
  const longest = await client.post(reopenPath(protocol), {
    justification: ` ${"a".repeat(4000)} `,
    closureRef: (await getClosureRef(protocol)).toUpperCase(),
  });
  expect(longest.status).toBe(200);
  const events = await reopenEvents(protocol).orderBy("audit_id");
  expect(events.map(({ note }) => note)).toEqual(["a", "a".repeat(4000)]);
});

it("E03/H01: auditoria e timeline autorizadas preservam o evento e a reunião legada", async () => {
  const { protocol, user, client } = await fixture();
  const admin = await login((await insertAdmin()).email);
  await testDb("system_settings").where({ settings_id: 1 }).update({ solicitation_mode: "PUBLIC" });
  const oldMeeting = "https://example.invalid/reuniao-legada";
  await requestRow(protocol).update({
    meeting_scheduled_for: "2030-01-01T12:00:00.123456Z",
    meeting_link: oldMeeting,
  });
  const closureRef = await getClosureRef(protocol);
  const publicClient = new TestClient(server.baseUrl);
  const identityHeaders = {
    "X-Requester-Identity": JSON.stringify({ name: user.full_name, email: user.email }),
  };
  const before = await publicClient.request<{ details: Record<string, unknown> }>(
    "GET",
    trackingPath(protocol),
    { headers: identityHeaders },
  );
  expect(before.status).toBe(200);
  expect(before.body.details).not.toHaveProperty("canReopen");
  expect(before.body.details).not.toHaveProperty("closureRef");
  expect(before.headers.get("cache-control")).toBe("private, no-store");

  const result = await client.post(reopenPath(protocol), {
    justification: "  Reavaliar requisitos.  ",
    closureRef,
  });
  expect(result.status).toBe(200);
  for (const actor of [client, publicClient]) {
    const tracking = await actor.request<{ details: Record<string, unknown> }>(
      "GET",
      trackingPath(protocol),
      actor === publicClient ? { headers: identityHeaders } : {},
    );
    expect(tracking.status).toBe(200);
    expect(tracking.body.details).toMatchObject({
      status: "Solicitação enviada",
      meeting: null,
      lastTechnicalMessage: "Solicitação reaberta pelo titular.",
    });
    expect(tracking.body.details).not.toHaveProperty("closureRef");
    expect(JSON.stringify(tracking.body)).not.toContain("Reavaliar requisitos.");
    expect(JSON.stringify(tracking.body)).not.toContain(oldMeeting);
  }

  const denied = await client.get(`/audit-logs/${protocol}`);
  expectError(denied, 403);
  const audit = await admin.get<
    Array<{ audit_id: number; action_type: string; occurred_at: string }>
  >(`/audit-logs/${protocol}`);
  expect(audit.status).toBe(200);
  expect(audit.headers.get("cache-control")).toBe("private, no-store");
  const found = audit.body.filter((item) => item.action_type === "request.reopen");
  expect(found).toHaveLength(1);
  const [record] = found;
  if (!record) throw new Error("Evento de reabertura ausente.");
  expect(record).toMatchObject({
    entity_id: protocol,
    actor: { kind: "user", userId: user.user_id, displayName: user.full_name },
    change_origin: "requester",
    previous_value: "Concluído",
    new_value: "Solicitação enviada",
    note: "Reavaliar requisitos.",
    last_technical_message: "Solicitação reaberta pelo titular.",
    previous_meeting: { scheduledFor: expect.stringContaining(".123456"), link: oldMeeting },
  });
  expect(Number.isFinite(Date.parse(record.occurred_at))).toBe(true);
  const detail = await admin.get(`/audit-history/${record.audit_id}`);
  expect(detail.status).toBe(200);
  expect(detail.body).toEqual(record);

  expectError(await client.get(`/requests/${protocol}/internal-notes`), 403);
  const timeline = await admin.get<{ items: Array<{ action?: string }> }>(
    `/requests/${protocol}/internal-notes?limit=20`,
  );
  expect(timeline.status).toBe(200);
  const reopenItems = timeline.body.items.filter((item) => item.action === "request.reopen");
  expect(reopenItems).toEqual([
    expect.objectContaining({
      id: `audit:${record.audit_id}`,
      text: "Solicitação reaberta",
      occurredAt: record.occurred_at,
      actor: { id: String(user.user_id), name: user.full_name, role: "Solicitante" },
      changeOrigin: "requester",
      justification: "Reavaliar requisitos.",
      lastTechnicalMessage: "Solicitação reaberta pelo titular.",
    }),
  ]);
});

it("C01 HTTP: duas confirmações aguardam o lock e só uma gera sucesso", async () => {
  const { protocol, client } = await fixture();
  const closureRef = await getClosureRef(protocol);
  const gate = await testDb.transaction();
  let outcome: Promise<Array<{ status: number; body: unknown }>> | undefined;
  try {
    await gate("requests").where({ protocol }).forNoKeyUpdate().first("request_id");
    outcome = Promise.all([
      client.post(reopenPath(protocol), { justification: "Primeira", closureRef }),
      client.post(reopenPath(protocol), { justification: "Segunda", closureRef }),
    ]);
    await vi.waitFor(
      async () => {
        const { rows } = await testDb.raw<{ rows: Array<{ waiting: number }> }>(
          `SELECT count(*)::int AS waiting
         FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'
           AND query LIKE '%from "requests"%' AND query LIKE '%for no key update%'`,
        );
        expect(rows[0]?.waiting).toBe(2);
      },
      { timeout: 4_000 },
    );
  } finally {
    await gate.rollback();
    await outcome;
  }
  const results = await outcome;
  expect(results?.map(({ status }) => status).sort()).toEqual([200, 409]);
  const rejected = results?.find(({ status }) => status === 409);
  expect(rejected?.body).toMatchObject({ code: "rf02_closure_conflict" });
  expect(await requestRow(protocol).first("status_id")).toEqual({
    status_id: STATUS_IDS.requestSent,
  });
  expect(await reopenEvents(protocol)).toHaveLength(1);
});

it("C03 HTTP: falha da auditoria retorna erro, reverte a linha e deixa tentar de novo", async () => {
  const { protocol, client } = await fixture();
  const before = await requestRow(protocol).first();
  const closureRef = await getClosureRef(protocol);
  const payload = { justification: "Reavaliar", closureRef };
  await failAuditWrites();
  try {
    expectError(await client.post(reopenPath(protocol), payload), 500);
    expect(await requestRow(protocol).first()).toEqual(before);
    expect(await reopenEvents(protocol)).toHaveLength(0);
  } finally {
    await restoreAuditWrites();
  }
  expect((await client.post(reopenPath(protocol), payload)).status).toBe(200);
  expect(await reopenEvents(protocol)).toHaveLength(1);
});

it("E02: OpenAPI declara o contrato e mantém a capacidade fora do tracking público", async () => {
  const { openapiSpec } = await import("../../src/docs/swagger.ts");
  const operation = openapiSpec.paths["/requests/{protocol}/reopen"].post;
  expect(operation.security).toEqual([{ cookieAuth: [] }]);
  expect(Object.keys(operation.responses).sort()).toEqual([
    "200",
    "400",
    "401",
    "403",
    "404",
    "409",
    "422",
  ]);
  expect(operation.requestBody.content["application/json"].schema.$ref).toBe(
    "#/components/schemas/ReopenRequestPayload",
  );
  expect(openapiSpec.components.schemas.ReopenRequestPayload).toMatchObject({
    additionalProperties: false,
    required: ["justification", "closureRef"],
    properties: {
      justification: { minLength: 1, maxLength: 4000 },
      closureRef: { format: "uuid" },
    },
  });
  expect(openapiSpec.components.schemas.RequesterRequestDetails.required).toContain("canReopen");
  expect(openapiSpec.components.schemas.PublicRequestDetails.properties).not.toHaveProperty(
    "canReopen",
  );
  expect(openapiSpec.components.schemas.PublicRequestDetails.properties).not.toHaveProperty(
    "closureRef",
  );
});
