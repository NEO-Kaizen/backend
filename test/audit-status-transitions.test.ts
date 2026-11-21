import assert from "node:assert/strict";
import test from "node:test";
import { isComposedAuditAction, isAuditEntityName } from "../src/shared/audit/auditCatalog.ts";
import { calculateStatusTime } from "../src/modules/auditHistory/statusTime.ts";

test("status transitions accept human request actions", () => {
  assert.equal(isComposedAuditAction("request", "request.status_change"), true);
  assert.equal(isComposedAuditAction("request", "request.override_status_admin"), true);
});

test("status transitions accept triage and automatic request actions", () => {
  assert.equal(isComposedAuditAction("request", "request.triage"), true);
  assert.equal(isComposedAuditAction("request", "request.status_change"), true);
});

test("denied transitions use the request access_denied action", () => {
  assert.equal(isComposedAuditAction("request", "request.access_denied"), true);
});

test("request remains a valid audit entity", () => {
  assert.equal(isAuditEntityName("request"), true);
});

test("status time separates active and paused periods", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T10:00:00Z"),
    initialStatus: "Em triagem",
    currentStatus: "Em triagem",
    pausedStatusNames: ["Pendente de informações"],
    transitions: [
      {
        status: "Pendente de informações",
        occurredAt: new Date("2026-11-20T11:00:00Z"),
      },
      {
        status: "Em triagem",
        occurredAt: new Date("2026-11-20T13:00:00Z"),
      },
    ],
    now: new Date("2026-11-20T14:00:00Z"),
  });

  assert.equal(result.totalActiveMilliseconds, 2 * 60 * 60 * 1000);
  assert.equal(result.totalPausedMilliseconds, 2 * 60 * 60 * 1000);
  assert.equal(result.intervals.at(-1)?.exitedAt, null);
  assert.deepEqual(
    result.totalsByStatus.find((total) => total.status === "Em triagem"),
    {
      status: "Em triagem",
      activeMilliseconds: 2 * 60 * 60 * 1000,
      pausedMilliseconds: 0,
      isPaused: false,
    },
  );
});

test("completed request closes each audited interval and the final status", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T09:00:00Z"),
    initialStatus: "Em triagem",
    currentStatus: "Concluída",
    pausedStatusNames: ["Pendente de informações"],
    transitions: [
      {
        status: "Pendente de informações",
        occurredAt: new Date("2026-11-20T10:00:00Z"),
      },
      {
        status: "Concluída",
        occurredAt: new Date("2026-11-20T12:00:00Z"),
      },
    ],
    now: new Date("2026-11-20T13:00:00Z"),
  });

  assert.equal(result.intervals.at(-1)?.exitedAt, null);
  assert.equal(result.intervals.at(-1)?.status, "Concluída");
  assert.equal(result.totalActiveMilliseconds, 2 * 60 * 60 * 1000);
  assert.equal(result.totalPausedMilliseconds, 2 * 60 * 60 * 1000);
});

test("in-progress request keeps the current status open", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T09:00:00Z"),
    initialStatus: "Em triagem",
    currentStatus: "Em atendimento",
    pausedStatusNames: [],
    transitions: [
      {
        status: "Em atendimento",
        occurredAt: new Date("2026-11-20T10:00:00Z"),
      },
    ],
    now: new Date("2026-11-20T12:00:00Z"),
  });

  assert.equal(result.intervals.at(-1)?.status, "Em atendimento");
  assert.equal(result.intervals.at(-1)?.exitedAt, null);
  assert.equal(result.intervals.at(-1)?.activeMilliseconds, 2 * 60 * 60 * 1000);
});

test("divergent audit and database status fails instead of inventing a period", () => {
  assert.throws(
    () =>
      calculateStatusTime({
        openedAt: new Date("2026-11-20T09:00:00Z"),
        initialStatus: "Em triagem",
        currentStatus: "Concluída",
        pausedStatusNames: [],
        transitions: [
          {
            status: "Em atendimento",
            occurredAt: new Date("2026-11-20T10:00:00Z"),
          },
        ],
        now: new Date("2026-11-20T12:00:00Z"),
      }),
    /não corresponde/,
  );
});
