import assert from "node:assert/strict";
import test from "node:test";
import { calculateStatusTime } from "../src/modules/auditHistory/statusTime.ts";
import {
  isRequestStatusTransitionAction,
  parseAuditedStatusName,
} from "../src/shared/audit/statusTransition.ts";

test("shared audit utility recognizes status actions and supported value formats", () => {
  assert.equal(isRequestStatusTransitionAction("request.status_change"), true);
  assert.equal(isRequestStatusTransitionAction("request.triage"), true);
  assert.equal(isRequestStatusTransitionAction("request.access_denied"), false);
  assert.equal(parseAuditedStatusName("Em triagem"), "Em triagem");
  assert.equal(parseAuditedStatusName('{"status":"Em triagem"}'), "Em triagem");
  assert.equal(parseAuditedStatusName('{"status":4}'), null);
});

test("status time separates active and paused periods", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T10:00:00Z"),
    initialStatus: "Em triagem",
    initialStatusId: 3,
    currentStatus: "Em triagem",
    currentStatusId: 3,
    pausedStatusIds: [4],
    transitions: [
      {
        status: "Pendente de informações",
        statusId: 4,
        occurredAt: new Date("2026-11-20T11:00:00Z"),
      },
      {
        status: "Em triagem",
        statusId: 3,
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
    initialStatusId: 3,
    currentStatus: "Concluída",
    currentStatusId: 19,
    pausedStatusIds: [4],
    transitions: [
      {
        status: "Pendente de informações",
        statusId: 4,
        occurredAt: new Date("2026-11-20T10:00:00Z"),
      },
      {
        status: "Concluída",
        statusId: 19,
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
    initialStatusId: 3,
    currentStatus: "Em atendimento",
    currentStatusId: 7,
    pausedStatusIds: [],
    transitions: [
      {
        status: "Em atendimento",
        statusId: 7,
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
        pausedStatusIds: [],
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
