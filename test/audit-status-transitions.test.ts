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
    currentIsTerminal: false,
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

test("status time classifies pauses by status ID rather than label", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T10:00:00Z"),
    initialStatus: "Em triagem",
    initialStatusId: 4,
    currentStatus: "Pendente de informações",
    currentStatusId: 3,
    currentIsTerminal: false,
    pausedStatusIds: [4],
    transitions: [
      {
        status: "Pendente de informações",
        statusId: 3,
        occurredAt: new Date("2026-11-20T11:00:00Z"),
      },
    ],
    now: new Date("2026-11-20T12:00:00Z"),
  });

  assert.equal(result.intervals[0]?.isPaused, true);
  assert.equal(result.intervals[0]?.pausedMilliseconds, 60 * 60 * 1000);
  assert.equal(result.intervals[1]?.isPaused, false);
  assert.equal(result.intervals[1]?.activeMilliseconds, 60 * 60 * 1000);
});

test("completed request closes each audited interval and the final status", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T09:00:00Z"),
    initialStatus: "Em triagem",
    initialStatusId: 3,
    currentStatus: "Concluída",
    currentStatusId: 19,
    currentIsTerminal: true,
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

  assert.equal(result.intervals.at(-1)?.enteredAt, "2026-11-20T12:00:00.000Z");
  assert.equal(result.intervals.at(-1)?.exitedAt, "2026-11-20T12:00:00.000Z");
  assert.equal(result.intervals.at(-1)?.status, "Concluída");
  assert.equal(result.intervals.at(-1)?.activeMilliseconds, 0);
  assert.equal(result.intervals.at(-1)?.pausedMilliseconds, 0);
  assert.equal(result.totalActiveMilliseconds, 60 * 60 * 1000);
  assert.equal(result.totalPausedMilliseconds, 2 * 60 * 60 * 1000);
});

test("in-progress request keeps the current status open", () => {
  const result = calculateStatusTime({
    openedAt: new Date("2026-11-20T09:00:00Z"),
    initialStatus: "Em triagem",
    initialStatusId: 3,
    currentStatus: "Em atendimento",
    currentStatusId: 7,
    currentIsTerminal: false,
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
        currentIsTerminal: false,
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
