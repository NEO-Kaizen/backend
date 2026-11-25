import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterAll, beforeEach, expect, it, vi } from "vitest";
import { STATUS_IDS } from "../../src/shared/types/status.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertAdmin, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const { default: config } = await import("../../src/configs.ts");
const requests = await import("../../src/modules/requests/requests.service.ts");
const requestsRepo = await import("../../src/modules/requests/requests.repository.ts");
const { reopenRequest } = await import("../../src/modules/requests/requests-reopen.service.ts");
const pendencies = await import("../../src/modules/pendingItems/pendingItems.service.ts");
const mapping = await import("../../src/modules/queue/mapping.service.ts");
const triage = await import("../../src/modules/requests/triage/triage.service.ts");
const triageRepo = await import("../../src/modules/requests/triage/triage.repository.ts");
const { listQueueService } = await import("../../src/modules/queue/queue.service.ts");
const { listInternalNotes } =
  await import("../../src/modules/internalNotes/internalNotes.service.ts");
const { evaluateScore } =
  await import("../../src/modules/prioritization/prioritization.service.ts");
const prioritizationRepo =
  await import("../../src/modules/prioritization/prioritization.repository.ts");

const TRIAGE = {
  adherentToScope: "Não",
  adherentJustification: "Fora do escopo do exemplo.",
  changeCategory: "Não",
  newCategory: "",
  preliminaryComplexity: "",
  perceivedRisks: "",
  suggestedResponsible: "",
  suggestedResponsibleJustification: "",
  exitStatus: 5,
  result: "Avaliada",
  conclusionJustification: "Justificativa da avaliação.",
  lastTechnicalMessage: "Avaliação registrada.",
} as const;

beforeEach(resetTestDb);
afterAll(async () => {
  await closeTestDb();
  await rm(config.UPLOAD_DIR, { recursive: true, force: true });
});

async function fixture() {
  const requester = await insertUser({
    profileName: "solicitante",
    email: "titular@example.invalid",
  });
  const admin = await insertAdmin();
  const analyst = await insertUser({ email: "analista@example.invalid" });
  const professionalId = randomUUID();
  await testDb("details_professional").insert({
    professional_id: professionalId,
    user_id: analyst.user_id,
    job_title: "Analista",
    status: "active",
    capacity: 8,
  });
  const { protocol } = await requests.registerRequest(makeRequestPayload(), [], requester.user_id);
  return {
    protocol,
    professionalId,
    owner: {
      id: String(requester.user_id),
      name: requester.full_name,
      email: requester.email,
      role: "Solicitante" as const,
    },
    admin: {
      id: admin.user_id,
      name: admin.full_name,
      email: admin.email,
      role: "Administrador" as const,
    },
    analyst: {
      id: analyst.user_id,
      name: analyst.full_name,
      email: analyst.email,
      role: "Analista" as const,
    },
  };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;
const row = (protocol: string) => testDb("requests").where({ protocol });
const events = (protocol: string, action: string) =>
  testDb("audit_history").where({ entity_id: protocol, action_type: action });
const changeStatus = (f: Fixture, targetStatus: number) =>
  requests.updateRequestStatus(
    f.protocol,
    { targetStatus, justification: "Ajuste", lastTechnicalMessage: "Status atualizado." },
    f.admin,
    undefined,
  );

async function reopen(f: Fixture) {
  const before = await row(f.protocol).first("closure_ref");
  const closureRef: unknown = before?.closure_ref;
  if (typeof closureRef !== "string") throw new Error("Fixture sem encerramento.");
  return reopenRequest({
    protocol: f.protocol,
    actor: f.owner,
    closureRef,
    justification: "Reavaliar.",
  });
}

async function openPending(f: Fixture) {
  const batch = await pendencies.createPendingItems(
    f.protocol,
    { observation: "Detalhe" },
    f.admin,
    undefined,
  );
  const item = batch.items[0];
  if (!item) throw new Error("Fixture sem pendência.");
  return { batchId: batch.batchId, id: item.id };
}

const respond = (f: Fixture, id: string) =>
  pendencies.respondPendingItem(
    f.protocol,
    id,
    { response: "Resposta" },
    f.owner.email,
    false,
    undefined,
    { user: f.owner },
  );
const review = (f: Fixture, item: { batchId: string; id: string }) =>
  pendencies.reviewPendingItems(
    f.protocol,
    {
      batchId: item.batchId,
      requestAttachment: false,
      items: [{ id: item.id, decision: "reopen", comment: "Rever" }],
    },
    f.admin,
    undefined,
  );

function attach(f: Fixture, id: string) {
  const buffer = Buffer.from("%PDF-1.4 fixture");
  return pendencies.addAttachment(
    f.protocol,
    id,
    {
      fieldname: "file",
      originalname: "fixture.pdf",
      encoding: "7bit",
      mimetype: "application/pdf",
      size: buffer.length,
      buffer,
      stream: Readable.from(buffer),
      destination: "",
      filename: "",
      path: "",
    },
    undefined,
    { user: f.owner },
  );
}

async function schedule(f: Fixture, day: string) {
  return mapping.upsertMappingService(
    f.protocol,
    {
      completeMapping: true,
      targetStatus: STATUS_IDS.mappingScheduled,
      scheduledFor: `2030-01-${day}T12:00:00Z`,
      durationMinutes: 60,
      modality: "REMOTE",
      meetingLink: `https://example.invalid/reuniao-${day}`,
    },
    f.admin,
  );
}

it("A02: retira a reunião vigente das quatro projeções e permite novo mapeamento", async () => {
  const f = await fixture();
  const old = await schedule(f, "01");
  expect(old.id).toBeTruthy();
  if (!old.id) throw new Error("Agendamento sem ID.");
  const previousMapping = await testDb("mappings").where({ mapping_id: old.id }).first();
  const previousAudit = await testDb("audit_history").where({
    entity_type: "mapping",
    entity_id: old.id,
  });
  expect(previousAudit.length).toBeGreaterThan(0);
  expect((await requests.getTracking(f.protocol, { user: f.owner })).details.meeting?.link).toBe(
    old.meetingLink,
  );
  await changeStatus(f, STATUS_IDS.completed);
  await reopen(f);

  expect((await requests.getTracking(f.protocol, { user: f.owner })).details.meeting).toBeNull();
  expect((await requests.findRequest(f.protocol, Number(f.owner.id))).meeting).toBeNull();
  expect(await requests.findInternalByProtocol(f.protocol)).toMatchObject({
    meeting: null,
    mappingDate: null,
  });
  expect(await mapping.getMappingService(f.protocol)).toMatchObject({
    id: null,
    meetingLink: null,
  });
  await expect(
    mapping.upsertMappingService(f.protocol, { id: old.id, completeMapping: false }, f.admin),
  ).rejects.toMatchObject({ statusCode: 404 });
  expect(
    JSON.stringify(
      await listInternalNotes(f.protocol, f.admin.id, { limit: 30, cursor: undefined }),
    ),
  ).toContain(old.meetingLink);
  const fresh = await schedule(f, "02");
  expect(fresh.id).not.toBe(old.id);
  expect((await requests.getTracking(f.protocol, { user: f.owner })).details.meeting?.link).toBe(
    fresh.meetingLink,
  );
  expect(await testDb("mappings").where({ mapping_id: old.id }).first()).toEqual(previousMapping);
  expect(
    await testDb("audit_history").where({ entity_type: "mapping", entity_id: old.id }),
  ).toEqual(previousAudit);
});

it("A02 legado: preserva a única informação da reunião na auditoria de reabertura", async () => {
  const f = await fixture();
  await row(f.protocol).update({
    meeting_scheduled_for: "2030-02-01T12:00:00.123456Z",
    meeting_link: "https://example.invalid/legado",
  });
  const legacy = await row(f.protocol)
    .select(testDb.raw("to_json(meeting_scheduled_for) #>> '{}' AS scheduled"))
    .first();
  expect(legacy.scheduled).toContain(".123456");
  await changeStatus(f, STATUS_IDS.completed);
  await reopen(f);
  expect(await row(f.protocol).first()).toMatchObject({
    meeting_scheduled_for: null,
    meeting_link: null,
  });
  expect(await events(f.protocol, "request.reopen").first()).toMatchObject({
    note: "Reavaliar.",
    previous_meeting: { scheduledFor: legacy.scheduled, link: "https://example.invalid/legado" },
  });
});

it("A01/P02: volta à fila, conserva a avaliação anterior e aceita novo cálculo e nova triagem", async () => {
  const f = await fixture();
  await triage.createTriage(f.protocol, TRIAGE, f.admin);
  const notes: Record<string, number> = Object.fromEntries(
    (await testDb("criteria").where({ active: true }).pluck("criterion_id")).map((id) => [id, 3]),
  );
  const oldScore = await evaluateScore(f.protocol, { notes }, f.admin);
  const previousEvaluation = await testDb("prioritization_evaluations")
    .where({ protocol: f.protocol })
    .first();
  const previousRow = await row(f.protocol).first();
  const oldTriages = await testDb("triages").where({ request_id: previousRow.request_id });
  const priorityId = await testDb("priorities").first("priority_id");
  await requests.assignAnalyst(
    f.protocol,
    { assigneeId: String(f.analyst.id) },
    f.admin,
    undefined,
  );
  await row(f.protocol).update({
    priority_id: priorityId.priority_id,
    screening_result: "elegivel",
    mapping_professional_id: f.professionalId,
  });
  await changeStatus(f, STATUS_IDS.completed);
  await reopen(f);

  expect(await row(f.protocol).first()).toMatchObject({
    status_id: 1,
    last_public_status_id: 1,
    professional_id: null,
    mapping_professional_id: null,
    priority_id: null,
    screening_result: null,
    created_at: previousRow.created_at,
  });
  expect(
    (
      await listQueueService({
        page: 1,
        pageSize: 20,
        unassigned: true,
        status: "Solicitação enviada",
        search: f.protocol,
      })
    ).data,
  ).toEqual([expect.objectContaining({ protocol: f.protocol })]);
  expect((await requests.findInternalByProtocol(f.protocol)).prioritization.score).toBeNull();
  expect(
    await testDb("prioritization_evaluations").where({ protocol: f.protocol }).first(),
  ).toEqual(previousEvaluation);
  expect(await testDb("triages").where({ request_id: previousRow.request_id })).toEqual(oldTriages);

  await requests.assignAnalyst(
    f.protocol,
    { assigneeId: String(f.analyst.id) },
    f.admin,
    undefined,
  );
  const fresh = await evaluateScore(f.protocol, { notes }, f.analyst);
  expect((await requests.findInternalByProtocol(f.protocol)).prioritization.score).toBe(
    fresh.score,
  );
  const calculations = await events(f.protocol, "prioritization.evaluate").orderBy("audit_id");
  expect(JSON.parse(calculations[1].previous_value)).toMatchObject({
    score: oldScore.score,
    notes,
  });
  await triage.createTriage(f.protocol, TRIAGE, f.analyst);
  expect(await testDb("triages").where({ request_id: previousRow.request_id })).toHaveLength(2);
});

it.each(["requested", "responded"] as const)(
  "P01/P03: pendência %s antiga fica histórica com seu anexo",
  async (state) => {
    const f = await fixture();
    const item = await openPending(f);
    await attach(f, item.id);
    if (state === "responded") await respond(f, item.id);
    const oldItem = await testDb("pending_items").where({ pending_item_id: item.id }).first();
    const oldAttachments = await testDb("attachments").where({ pending_item_id: item.id });
    const oldEvents = await testDb("audit_history")
      .where({ entity_id: item.id })
      .orderBy("audit_id");
    const attempt = () => (state === "responded" ? review(f, item) : respond(f, item.id));

    await changeStatus(f, STATUS_IDS.completed);
    await expect(attempt()).rejects.toMatchObject({
      statusCode: 409,
      code: "rf02_pending_terminal",
    });
    expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 16 });
    await reopen(f);
    await expect(attempt()).rejects.toMatchObject({
      statusCode: 409,
      code: "rf02_pending_historical",
    });
    await expect(attach(f, item.id)).rejects.toMatchObject({
      statusCode: 409,
      code: "rf02_pending_historical",
    });
    expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 1 });
    expect(await pendencies.listPendingItems(f.protocol, { user: f.owner })).toMatchObject({
      items: [],
      batchId: null,
    });
    expect((await requests.findInternalByProtocol(f.protocol)).pendingSummary.total).toBe(0);
    expect(await testDb("pending_items").where({ pending_item_id: item.id }).first()).toEqual(
      oldItem,
    );
    expect(await testDb("attachments").where({ pending_item_id: item.id })).toEqual(oldAttachments);
    expect(await readFile(join(config.UPLOAD_DIR, oldAttachments[0].file_path), "utf8")).toBe(
      "%PDF-1.4 fixture",
    );
    expect(await testDb("audit_history").where({ entity_id: item.id }).orderBy("audit_id")).toEqual(
      oldEvents,
    );

    const fresh = await openPending(f);
    expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 4 });
    await respond(f, fresh.id);
    expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 3 });
    await review(f, fresh);
    expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 4 });
  },
);

async function waitForRequestLock() {
  await vi.waitFor(
    async () => {
      const result = await testDb.raw<{ rows: Array<{ waiting: number }> }>(`
      SELECT count(*)::int AS waiting FROM pg_stat_activity
      WHERE datname = current_database() AND wait_event_type = 'Lock'
        AND query LIKE '%from "requests"%' AND query LIKE '%for no key update%'
    `);
      expect(result.rows[0]?.waiting).toBe(1);
    },
    { timeout: 4_000 },
  );
}

it("P04: resposta aguardando lock relê o encerramento e não grava", async () => {
  const f = await fixture();
  const item = await openPending(f);
  const before = await testDb("pending_items").where({ pending_item_id: item.id }).first();
  const writer = await testDb.transaction();
  let outcome: Promise<unknown> | undefined;
  try {
    await writer("requests")
      .where({ protocol: f.protocol })
      .update({ status_id: STATUS_IDS.completed });
    outcome = respond(f, item.id).catch((error: unknown) => error);
    await waitForRequestLock();
    await writer.commit();
  } finally {
    if (!writer.isCompleted()) await writer.rollback();
    await outcome;
  }
  expect(await outcome).toMatchObject({ statusCode: 409, code: "rf02_pending_terminal" });
  expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 16 });
  expect(await testDb("pending_items").where({ pending_item_id: item.id }).first()).toEqual(before);
  expect(await events(item.id, "pending_item.respond")).toHaveLength(0);
});

it("ordenação: uma gravação anterior ao lock de reabertura continua histórica", async () => {
  const f = await fixture();
  const item = await openPending(f);
  await changeStatus(f, STATUS_IDS.completed);
  const writer = await testDb.transaction();
  let outcome: Promise<unknown> | undefined;
  try {
    await writer("requests").where({ protocol: f.protocol }).forNoKeyUpdate().first("request_id");
    outcome = reopen(f).catch((error: unknown) => error);
    await waitForRequestLock();
    // A transação da RF02 já começou, mas esta escrita ainda pertence ao ciclo antigo.
    await writer("pending_items")
      .where({ pending_item_id: item.id })
      .update({ created_at: writer.raw("clock_timestamp()") });
    await writer.commit();
  } finally {
    if (!writer.isCompleted()) await writer.rollback();
    await outcome;
  }
  expect(await outcome).toMatchObject({ statusId: 1 });
  const current = await row(f.protocol).first();
  expect(current.last_external_update_at).toEqual(current.last_reopened_at);
  expect((await pendencies.listPendingItems(f.protocol, { user: f.owner })).items).toEqual([]);
  await expect(respond(f, item.id)).rejects.toMatchObject({ code: "rf02_pending_historical" });
});

it.each(["legado", "interno", "mapeamento"] as const)(
  "C04: atribuição %s via custódia antiga perde para a reabertura",
  async (path) => {
    const f = await fixture();
    await requests.assignAnalyst(
      f.protocol,
      { assigneeId: String(f.analyst.id) },
      f.admin,
      undefined,
    );
    await changeStatus(f, STATUS_IDS.completed);
    const release = Promise.withResolvers<void>();
    const observed = Promise.withResolvers<void>();
    const original = requestsRepo.findAssignmentContextByProtocol;
    vi.spyOn(requestsRepo, "findAssignmentContextByProtocol").mockImplementationOnce(
      async (...args) => {
        const value = await original(...args);
        observed.resolve();
        await release.promise;
        return value;
      },
    );
    const attempt =
      path === "legado"
        ? requests.assignResponsible(
            f.protocol,
            { professionalId: f.professionalId },
            f.analyst,
            undefined,
          )
        : requests.assignAnalyst(
            f.protocol,
            path === "interno"
              ? { assigneeId: String(f.analyst.id) }
              : { mappingAssigneeId: String(f.analyst.id) },
            f.analyst,
            undefined,
          );
    const rejected = expect(attempt).rejects.toMatchObject({
      statusCode: 409,
      code: "request_assignment_conflict",
    });
    try {
      await observed.promise;
      await reopen(f);
    } finally {
      release.resolve();
      await rejected;
    }
    expect(await row(f.protocol).first()).toMatchObject({
      status_id: 1,
      professional_id: null,
      mapping_professional_id: null,
    });
    expect(await events(f.protocol, "request.assign")).toHaveLength(1);
    await requests.assignAnalyst(
      f.protocol,
      { assigneeId: String(f.analyst.id) },
      f.admin,
      undefined,
    );
    await expect(triage.createTriage(f.protocol, TRIAGE, f.analyst)).resolves.toMatchObject({
      exitStatus: 5,
    });
  },
);

it.each([false, true])(
  "C02/C05: PATCH obsoleto após reabrir (novo 16: %s) recebe conflito",
  async (closeAgain) => {
    const f = await fixture();
    await changeStatus(f, STATUS_IDS.completed);
    const release = Promise.withResolvers<void>();
    const observed = Promise.withResolvers<void>();
    const original = requestsRepo.findRequestStatusContext;
    vi.spyOn(requestsRepo, "findRequestStatusContext").mockImplementationOnce(async (...args) => {
      const value = await original(...args);
      observed.resolve();
      await release.promise;
      return value;
    });
    const attempt = changeStatus(f, STATUS_IDS.canceled);
    const rejected = expect(attempt).rejects.toMatchObject({
      statusCode: 409,
      code: "rf02_closure_conflict",
    });
    try {
      await observed.promise;
      await reopen(f);
      if (closeAgain) await changeStatus(f, STATUS_IDS.completed);
    } finally {
      release.resolve();
      await rejected;
    }
    expect(await row(f.protocol).first("status_id")).toEqual({ status_id: closeAgain ? 16 : 1 });
    expect(await events(f.protocol, "request.override_status_admin")).toHaveLength(
      closeAgain ? 2 : 1,
    );
    if (!closeAgain) await changeStatus(f, STATUS_IDS.completed);
    await expect(changeStatus(f, STATUS_IDS.canceled)).resolves.toMatchObject({
      status: "Cancelado",
    });
  },
);

it("D01: bloqueia a saída direta e o desvio por terminal configurável, mantendo o fluxo legítimo", async () => {
  const f = await fixture();
  const terminalId = 90;
  await testDb("statuses").insert({
    status_id: terminalId,
    name: "Terminal de teste",
    order_number: 90,
    is_terminal: true,
    is_public: false,
  });
  try {
    await changeStatus(f, STATUS_IDS.inTriage);
    await changeStatus(f, STATUS_IDS.completed);
    for (const origin of [STATUS_IDS.completed, STATUS_IDS.canceled]) {
      if (origin === STATUS_IDS.canceled) await changeStatus(f, origin);
      const before = await row(f.protocol).first();
      const auditBefore = await events(f.protocol, "request.override_status_admin").orderBy(
        "audit_id",
      );
      for (const target of [STATUS_IDS.requestSent, terminalId]) {
        await expect(changeStatus(f, target)).rejects.toMatchObject({
          statusCode: 409,
          code: "rf02_use_reopen",
        });
      }
      expect(await row(f.protocol).first()).toEqual(before);
      expect(await events(f.protocol, "request.override_status_admin").orderBy("audit_id")).toEqual(
        auditBefore,
      );
    }
    await reopen(f);
    await changeStatus(f, terminalId);
    await expect(changeStatus(f, STATUS_IDS.requestSent)).resolves.toMatchObject({
      status: "Solicitação enviada",
    });
  } finally {
    await testDb("statuses").where({ status_id: terminalId }).del();
  }
});

it("ordenação A02: mapeamento que aguardou o lock é gravado com a data efetiva do novo ciclo", async () => {
  const f = await fixture();
  await changeStatus(f, STATUS_IDS.completed);
  await expect(schedule(f, "04")).rejects.toMatchObject({ statusCode: 422 });
  expect(await events(f.protocol, "request.access_denied")).toHaveLength(1);

  const reached = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const write = requestsRepo.clearReopenedRequestProjections;
  vi.spyOn(requestsRepo, "clearReopenedRequestProjections").mockImplementationOnce(
    async (...args) => {
      reached.resolve();
      await release.promise;
      return write(...args);
    },
  );
  const reopening = reopen(f);
  let scheduled: ReturnType<typeof schedule> | undefined;
  try {
    await reached.promise;
    scheduled = schedule(f, "04");
    await waitForRequestLock();
  } finally {
    release.resolve();
    await Promise.allSettled(scheduled ? [reopening, scheduled] : [reopening]);
  }
  await expect(reopening).resolves.toMatchObject({ statusId: 1 });
  const next = await scheduled;
  expect(next?.id).toBeTruthy();
  expect(await mapping.getMappingService(f.protocol)).toMatchObject({
    id: next?.id,
    meetingLink: next?.meetingLink,
  });
});

it("P02: avaliação iniciada no ciclo anterior não sobrescreve a priorização depois da reabertura", async () => {
  const f = await fixture();
  const notes: Record<string, number> = Object.fromEntries(
    (await testDb("criteria").where({ active: true }).pluck("criterion_id")).map((id) => [id, 3]),
  );
  await evaluateScore(f.protocol, { notes }, f.admin);
  const previous = await testDb("prioritization_evaluations")
    .where({ protocol: f.protocol })
    .first();
  await changeStatus(f, STATUS_IDS.completed);

  const reached = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const read = prioritizationRepo.findRequestEvaluationContext;
  vi.spyOn(prioritizationRepo, "findRequestEvaluationContext").mockImplementationOnce(
    async (...args) => {
      const result = await read(...args);
      reached.resolve();
      await release.promise;
      return result;
    },
  );
  const outcome = expect(evaluateScore(f.protocol, { notes }, f.admin)).rejects.toMatchObject({
    statusCode: 409,
    code: "request_evaluation_conflict",
  });
  try {
    await reached.promise;
    await reopen(f);
  } finally {
    release.resolve();
    await outcome;
  }
  expect(
    await testDb("prioritization_evaluations").where({ protocol: f.protocol }).first(),
  ).toEqual(previous);
  expect((await requests.findInternalByProtocol(f.protocol)).prioritization.score).toBeNull();
});

it("P02: triagem iniciada no primeiro status 1 não conclui o status 1 do novo ciclo", async () => {
  const f = await fixture();
  const reached = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const read = triageRepo.findRequestContext;
  vi.spyOn(triageRepo, "findRequestContext").mockImplementationOnce(async (...args) => {
    const result = await read(...args);
    reached.resolve();
    await release.promise;
    return result;
  });
  const outcome = expect(triage.createTriage(f.protocol, TRIAGE, f.admin)).rejects.toMatchObject({
    statusCode: 409,
    code: "request_triage_conflict",
  });
  try {
    await reached.promise;
    await changeStatus(f, STATUS_IDS.completed);
    await reopen(f);
  } finally {
    release.resolve();
    await outcome;
  }
  expect(await row(f.protocol).first("status_id")).toEqual({ status_id: 1 });
  expect(await events(f.protocol, "request.triage")).toHaveLength(0);
  await requests.assignAnalyst(
    f.protocol,
    { assigneeId: String(f.analyst.id) },
    f.admin,
    undefined,
  );
  await expect(triage.createTriage(f.protocol, TRIAGE, f.analyst)).resolves.toMatchObject({
    exitStatus: 5,
  });
});
