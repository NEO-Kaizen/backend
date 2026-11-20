import assert from "node:assert/strict";
import test from "node:test";
import { isComposedAuditAction, isAuditEntityName } from "../src/shared/audit/auditCatalog.ts";
import { calculateStatusTime } from "../src/shared/utils/statusTime.ts";

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
