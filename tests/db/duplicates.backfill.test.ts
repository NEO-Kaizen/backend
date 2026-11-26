import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupTestUploads,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, resetTestDb, testDb } from "../helpers/testDb.ts";
import { backfillConcludedAt } from "../../src/modules/duplicates/backfillConcludedAt.ts";
import type { CreateRequestResponse } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";

const backfillHooks = vi.hoisted(() => ({
  afterCandidatesLoaded: undefined as (() => Promise<void>) | undefined,
}));

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

vi.mock(
  "../../src/modules/duplicates/backfillConcludedAt.repository.ts",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../src/modules/duplicates/backfillConcludedAt.repository.ts")
      >();

    return {
      ...actual,
      listCompletedRequestsMissingConcludedAt: async () => {
        const candidates = await actual.listCompletedRequestsMissingConcludedAt();
        const hook = backfillHooks.afterCandidatesLoaded;
        backfillHooks.afterCandidatesLoaded = undefined;
        if (hook) await hook();
        return candidates;
      },
    };
  },
);

const OCCURRED_AT = new Date("2026-09-15T12:00:00.000Z");
const LEGACY_UPDATED_AT = new Date("2020-01-01T00:00:00.000Z");

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(async () => {
  backfillHooks.afterCandidatesLoaded = undefined;
  await resetTestDb();
  await testDb("system_settings")
    .where({ settings_id: 1 })
    .update({ duplicate_detection_enabled: true });
});

afterAll(async () => {
  await server.close();
  await cleanupTestUploads();
  await closeTestDb();
});

async function createRequest() {
  const client = new TestClient(server.baseUrl);
  const form = new FormData();
  form.append("payload", JSON.stringify(makeRequestPayload()));
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

async function markCompletedWithoutConcludedAt(protocol: string): Promise<void> {
  await testDb("requests").where({ protocol }).update({
    status_id: 16,
    concluded_at: null,
    updated_at: LEGACY_UPDATED_AT,
    updated_by: "legacy@neo.com",
  });
}

async function insertStatusAudit(input: {
  protocol: string;
  actionType: "request.status_change" | "request.override_status_admin" | "request.triage";
  previousValue?: string | null;
  newValue: string;
  occurredAt?: Date;
}): Promise<void> {
  await testDb("audit_history").insert({
    entity_type: "request",
    entity_id: input.protocol,
    action_type: input.actionType,
    previous_value: input.previousValue ?? null,
    new_value: input.newValue,
    user_id: null,
    occurred_at: input.occurredAt ?? OCCURRED_AT,
    change_origin: "system",
  });
}

describe("DB — backfill de concluded_at pela Auditoria", () => {
  it("reconstrói a entrada no Status 16 por request.status_change", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.status_change",
      previousValue: "Em triagem",
      newValue: "Concluído",
    });

    const report = await backfillConcludedAt();

    expect(report).toEqual({
      dryRun: false,
      scanned: 1,
      updated: [created.protocol],
      withoutEvent: [],
      skipped: [],
    });

    const request = await requestRow(created.protocol);
    const projection = await projectionRow(created.protocol);

    expect(request.concluded_at).toEqual(OCCURRED_AT);
    expect(request.updated_at).toEqual(LEGACY_UPDATED_AT);
    expect(request.updated_by).toBe("legacy@neo.com");
    expect(projection).toMatchObject({
      publication_status: "published",
      public_title: "Automatizar conciliação",
      public_status: "Concluída",
      redaction_version: "v1-regex",
    });
    expect(projection.public_concluded_at).toEqual(OCCURRED_AT);
  });

  it("usa exitStatus do evento request.triage", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.triage",
      newValue: JSON.stringify({
        triageId: "00000000-0000-4000-8000-000000000000",
        exitStatus: 16,
        status: "Concluído",
      }),
    });

    const report = await backfillConcludedAt();

    expect(report.updated).toEqual([created.protocol]);
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      concluded_at: OCCURRED_AT,
    });
  });

  it("aceita override_status_admin e mantém idempotência", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.override_status_admin",
      previousValue: "Em triagem",
      newValue: "Concluído",
    });

    const first = await backfillConcludedAt();
    const second = await backfillConcludedAt();

    expect(first.updated).toEqual([created.protocol]);
    expect(second).toEqual({
      dryRun: false,
      scanned: 0,
      updated: [],
      withoutEvent: [],
      skipped: [],
    });
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      concluded_at: OCCURRED_AT,
    });
  });

  it("processa candidatas do mesmo lote com eventos agrupados por protocolo", async () => {
    const first = await createRequest();
    const second = await createRequest();
    await markCompletedWithoutConcludedAt(first.protocol);
    await markCompletedWithoutConcludedAt(second.protocol);

    const firstOccurredAt = new Date("2026-08-10T10:00:00.000Z");
    const secondOccurredAt = new Date("2026-08-20T10:00:00.000Z");

    await insertStatusAudit({
      protocol: first.protocol,
      actionType: "request.status_change",
      previousValue: "Em triagem",
      newValue: "Concluído",
      occurredAt: firstOccurredAt,
    });
    await insertStatusAudit({
      protocol: second.protocol,
      actionType: "request.status_change",
      previousValue: "Em triagem",
      newValue: "Concluído",
      occurredAt: secondOccurredAt,
    });

    const report = await backfillConcludedAt();

    expect(report.scanned).toBe(2);
    expect(report.updated).toHaveLength(2);
    expect(report.updated).toEqual(expect.arrayContaining([first.protocol, second.protocol]));
    expect(report.withoutEvent).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.scanned).toBe(
      report.updated.length + report.withoutEvent.length + report.skipped.length,
    );

    await expect(requestRow(first.protocol)).resolves.toMatchObject({
      concluded_at: firstOccurredAt,
    });
    await expect(requestRow(second.protocol)).resolves.toMatchObject({
      concluded_at: secondOccurredAt,
    });
  });

  it("dry-run relata o que faria e não escreve nada", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.status_change",
      previousValue: "Em triagem",
      newValue: "Concluído",
    });

    const before = await projectionRow(created.protocol);
    const report = await backfillConcludedAt({ dryRun: true });

    expect(report).toEqual({
      dryRun: true,
      scanned: 1,
      updated: [created.protocol],
      withoutEvent: [],
      skipped: [],
    });
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      concluded_at: null,
      updated_at: LEGACY_UPDATED_AT,
    });
    await expect(projectionRow(created.protocol)).resolves.toMatchObject({
      publication_status: before.publication_status,
      public_title: before.public_title,
      version: before.version,
    });
  });

  it("concluída sem evento é apenas relatada e não ganha projeção", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    const request = await requestRow(created.protocol);
    await testDb("request_public_projections").where({ request_id: request.request_id }).del();

    const report = await backfillConcludedAt();

    expect(report).toEqual({
      dryRun: false,
      scanned: 1,
      updated: [],
      withoutEvent: [created.protocol],
      skipped: [],
    });
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      concluded_at: null,
      updated_at: LEGACY_UPDATED_AT,
    });
    await expect(projectionRow(created.protocol)).resolves.toBeUndefined();
  });

  it("nunca usa updated_at como fallback de conclusão", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);

    const report = await backfillConcludedAt({ dryRun: true });

    expect(report.withoutEvent).toEqual([created.protocol]);
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      concluded_at: null,
      updated_at: LEGACY_UPDATED_AT,
    });
  });

  it("último evento de saída do Status 16 não grava data", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.status_change",
      previousValue: "Em triagem",
      newValue: "Concluído",
      occurredAt: new Date("2026-08-01T10:00:00.000Z"),
    });
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.status_change",
      previousValue: "Concluído",
      newValue: "Em triagem",
      occurredAt: new Date("2026-09-01T10:00:00.000Z"),
    });

    const report = await backfillConcludedAt();

    expect(report.withoutEvent).toEqual([created.protocol]);
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      concluded_at: null,
    });
  });

  it("marca como skipped quando o Status muda entre a leitura e o update", async () => {
    const created = await createRequest();
    await markCompletedWithoutConcludedAt(created.protocol);
    await insertStatusAudit({
      protocol: created.protocol,
      actionType: "request.status_change",
      previousValue: "Em triagem",
      newValue: "Concluído",
    });

    // Hook determinístico na fronteira do repository: a leitura de candidatas
    // ainda enxerga o 16, mas o UPDATE do backfill encontra o novo Status.
    backfillHooks.afterCandidatesLoaded = async () => {
      await testDb("requests").where({ protocol: created.protocol }).update({ status_id: 13 });
    };

    const report = await backfillConcludedAt();

    expect(report).toEqual({
      dryRun: false,
      scanned: 1,
      updated: [],
      withoutEvent: [],
      skipped: [created.protocol],
    });
    await expect(requestRow(created.protocol)).resolves.toMatchObject({
      status_id: 13,
      concluded_at: null,
    });
  });
});
