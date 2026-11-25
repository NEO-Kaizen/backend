import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, it, vi } from "vitest";
import { STATUS_IDS } from "../../src/shared/types/status.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import {
  closeTestDb,
  failAuditWrites,
  insertUser,
  resetTestDb,
  restoreAuditWrites,
  testDb,
} from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const { reopenRequest } = await import("../../src/modules/requests/requests-reopen.service.ts");
const { registerRequest, cancelRequest } =
  await import("../../src/modules/requests/requests.service.ts");
const migration = { name: "20261125090000_add_request_closure_ref.js" };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

beforeEach(resetTestDb);
afterAll(closeTestDb);

async function makeOwnedRequest() {
  const user = await insertUser({ profileName: "solicitante" });
  const { protocol } = await registerRequest(makeRequestPayload(), [], user.user_id);
  return {
    protocol,
    actor: { id: String(user.user_id), email: user.email, role: "Solicitante" as const },
    justification: "  Reavaliar solicitação.  ",
  };
}

function requestRow(protocol: string) {
  return testDb("requests").where({ protocol });
}

function reopenEvents(protocol: string) {
  return testDb("audit_history").where({
    entity_type: "request",
    entity_id: protocol,
    action_type: "request.reopen",
  });
}

async function readClosureRef(protocol: string): Promise<string> {
  const row = await requestRow(protocol).first("closure_ref");
  const reference: unknown = row?.closure_ref;
  if (typeof reference !== "string") {
    throw new Error("Esperava referência de encerramento na fixture.");
  }
  return reference;
}

it("B02: reverte a migration e refaz o backfill sem alterar os dados legados", async () => {
  await testDb.migrate.down(migration);
  try {
    expect(await testDb.schema.hasColumn("requests", "closure_ref")).toBe(false);
    const request = await makeOwnedRequest();
    await requestRow(request.protocol).update({ status_id: STATUS_IDS.completed });
    const existing = await requestRow(request.protocol).first();
    const previousAudit = await testDb("audit_history")
      .where({ entity_id: request.protocol })
      .orderBy("audit_id");

    await testDb.migrate.up(migration);
    const firstClosure = await readClosureRef(request.protocol);
    expect(await requestRow(request.protocol).first()).toEqual({
      ...existing,
      closure_ref: firstClosure,
    });
    expect(
      await testDb("audit_history").where({ entity_id: request.protocol }).orderBy("audit_id"),
    ).toEqual(previousAudit);

    await requestRow(request.protocol).update({ title: "Edição da fixture" });
    await requestRow(request.protocol).update({ status_id: STATUS_IDS.completed });
    expect(await readClosureRef(request.protocol)).toBe(firstClosure);

    await requestRow(request.protocol).update({ status_id: STATUS_IDS.canceled });
    const reclassifiedClosure = await readClosureRef(request.protocol);
    expect(reclassifiedClosure).not.toBe(firstClosure);
    await reopenRequest({ ...request, closureRef: reclassifiedClosure });
    expect(await requestRow(request.protocol).first("closure_ref")).toEqual({ closure_ref: null });

    await requestRow(request.protocol).update({ status_id: STATUS_IDS.canceled });
    const nextClosure = await readClosureRef(request.protocol);
    expect(nextClosure).not.toBe(reclassifiedClosure);
    await expect(
      reopenRequest({ ...request, closureRef: reclassifiedClosure }),
    ).rejects.toMatchObject({ statusCode: 409, code: "rf02_closure_conflict" });
    await expect(reopenRequest({ ...request, closureRef: nextClosure })).resolves.toMatchObject({
      protocol: request.protocol,
      statusId: STATUS_IDS.requestSent,
    });

    await testDb.migrate.down(migration);
    expect(await testDb.schema.hasColumn("requests", "closure_ref")).toBe(false);
    expect(await requestRow(request.protocol).first("status_id", "created_at")).toEqual({
      status_id: STATUS_IDS.requestSent,
      created_at: existing.created_at,
    });
    expect(await reopenEvents(request.protocol)).toHaveLength(2);
  } finally {
    await testDb.migrate.up(migration);
  }
});

it("C01: apenas uma das duas transações simultâneas reabre o mesmo encerramento", async () => {
  const request = await makeOwnedRequest();
  await requestRow(request.protocol).update({ status_id: STATUS_IDS.completed });
  const closureRef = await readClosureRef(request.protocol);
  const gate = await testDb.transaction();
  await gate("requests").where({ protocol: request.protocol }).forNoKeyUpdate().first("request_id");
  const operations = Promise.allSettled([
    reopenRequest({ ...request, closureRef }),
    reopenRequest({ ...request, closureRef }),
  ]);
  try {
    await vi.waitFor(
      async () => {
        const { rows } = await testDb.raw<{ rows: Array<{ waiting: number }> }>(
          `SELECT count(*)::int AS waiting
         FROM pg_stat_activity
         WHERE datname = current_database() AND wait_event_type = 'Lock'
           AND query LIKE ? AND query LIKE ?`,
          ['%from "requests"%', "%for no key update%"],
        );
        expect(rows[0]?.waiting).toBe(2);
      },
      { timeout: 4_000 },
    );
  } finally {
    await gate.commit();
    await operations;
  }

  const results = await operations;
  expect(results).toHaveLength(2);
  expect(results.filter(({ status }) => status === "fulfilled")).toEqual([
    {
      status: "fulfilled",
      value: { protocol: request.protocol, statusId: 1, status: "Solicitação enviada" },
    },
  ]);
  expect(results.filter(({ status }) => status === "rejected")).toEqual([
    {
      status: "rejected",
      reason: expect.objectContaining({ statusCode: 409, code: "rf02_closure_conflict" }),
    },
  ]);
  const events = await reopenEvents(request.protocol);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    user_id: Number(request.actor.id),
    previous_value: "Concluído",
    new_value: "Solicitação enviada",
    note: "Reavaliar solicitação.",
    change_origin: "requester",
    occurred_at: expect.any(Date),
  });
});

it("C03: falha na auditoria reverte a linha inteira e a referência ainda serve", async () => {
  const request = await makeOwnedRequest();
  await requestRow(request.protocol).update({
    status_id: STATUS_IDS.canceled,
    last_public_status_id: STATUS_IDS.canceled,
    last_technical_message: "Cancelamento anterior.",
    meeting_scheduled_for: "2030-01-01T12:00:00Z",
    meeting_link: "https://example.invalid/rollback",
    screening_result: "elegivel",
  });
  const before = await requestRow(request.protocol).first();
  const closureRef = await readClosureRef(request.protocol);

  await failAuditWrites();
  try {
    await expect(reopenRequest({ ...request, closureRef })).rejects.toThrow(
      "test: falha forçada na auditoria",
    );
    expect(await requestRow(request.protocol).first()).toEqual(before);
    expect(await reopenEvents(request.protocol)).toHaveLength(0);
  } finally {
    await restoreAuditWrites();
  }

  await reopenRequest({ ...request, closureRef });
  expect(await requestRow(request.protocol).first()).toMatchObject({
    status_id: STATUS_IDS.requestSent,
    closure_ref: null,
    last_public_status_id: STATUS_IDS.requestSent,
    last_technical_message: "Solicitação reaberta pelo titular.",
    meeting_scheduled_for: null,
    meeting_link: null,
    screening_result: null,
    last_reopened_at: expect.any(Date),
    created_at: before.created_at,
  });
  expect(await reopenEvents(request.protocol)).toHaveLength(1);
});

it("identidade do ciclo é um UUID imutável, independente do relógio", async () => {
  const request = await makeOwnedRequest();
  expect(await requestRow(request.protocol).first("reopen_ref")).toEqual({ reopen_ref: null });

  // Ciclo 1: a reabertura grava a identidade.
  await requestRow(request.protocol).update({ status_id: STATUS_IDS.canceled });
  await reopenRequest({ ...request, closureRef: await readClosureRef(request.protocol) });
  const first = await requestRow(request.protocol).first("reopen_ref", "last_reopened_at");
  expect(first?.reopen_ref).toMatch(UUID_V4);

  // Ciclo 2: outra reabertura produz outra identidade.
  await requestRow(request.protocol).update({ status_id: STATUS_IDS.canceled });
  await reopenRequest({ ...request, closureRef: await readClosureRef(request.protocol) });
  const second = await requestRow(request.protocol).first("reopen_ref", "last_reopened_at");
  expect(second?.reopen_ref).toMatch(UUID_V4);
  expect(second?.reopen_ref).not.toBe(first?.reopen_ref);

  // Edição comum não altera a identidade.
  await requestRow(request.protocol).update({ title: "Edição comum" });
  expect(await requestRow(request.protocol).first("reopen_ref")).toEqual({
    reopen_ref: second?.reopen_ref,
  });

  // Mesmo que o marco temporal seja forçado a coincidir, a identidade não muda.
  await requestRow(request.protocol).update({ last_reopened_at: first?.last_reopened_at });
  expect((await requestRow(request.protocol).first("last_reopened_at"))?.last_reopened_at).toEqual(
    first?.last_reopened_at,
  );
  expect(await requestRow(request.protocol).first("reopen_ref")).toEqual({
    reopen_ref: second?.reopen_ref,
  });

  const actor = { id: Number(request.actor.id), email: request.actor.email };
  await expect(
    cancelRequest(
      request.protocol,
      {
        justification: "Confirmação do ciclo anterior",
        cancelCycleRef: String(first?.reopen_ref),
      },
      actor,
      undefined,
    ),
  ).rejects.toMatchObject({ statusCode: 409, code: "rf07_cycle_conflict" });
  await expect(
    cancelRequest(
      request.protocol,
      {
        justification: "Confirmação do ciclo atual",
        cancelCycleRef: String(second?.reopen_ref),
      },
      actor,
      undefined,
    ),
  ).resolves.toEqual({ status: "Cancelado" });
  expect(await requestRow(request.protocol).first("status_id")).toEqual({
    status_id: STATUS_IDS.canceled,
  });
});

it("aplica perfil, titularidade direta, estado elegível e justificativa no serviço", async () => {
  const request = await makeOwnedRequest();
  await expect(reopenRequest({ ...request, closureRef: randomUUID() })).rejects.toMatchObject({
    statusCode: 409,
  });

  await requestRow(request.protocol).update({ status_id: STATUS_IDS.canceled });
  const closureRef = await readClosureRef(request.protocol);
  const other = await insertUser({ profileName: "solicitante", email: "outro@example.invalid" });
  await expect(
    reopenRequest({
      ...request,
      closureRef,
      actor: { ...request.actor, id: String(other.user_id) },
    }),
  ).rejects.toMatchObject({ statusCode: 404 });
  await expect(
    reopenRequest({ ...request, closureRef, actor: { ...request.actor, role: "Administrador" } }),
  ).rejects.toMatchObject({ statusCode: 403 });
  await expect(
    reopenRequest({ ...request, closureRef, justification: "  " }),
  ).rejects.toMatchObject({ statusCode: 422, fields: { justification: expect.any(String) } });
  await requestRow(request.protocol).update({ requester_user_id: null });
  await expect(reopenRequest({ ...request, closureRef })).rejects.toMatchObject({
    statusCode: 404,
  });
  expect(await reopenEvents(request.protocol)).toHaveLength(0);
});
