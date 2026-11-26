import { describe, expect, it } from "vitest";
import {
  replayConcludedAt,
  resolveAuditEventStatusId,
} from "../../src/modules/duplicates/concludedAtReplay.ts";

const ENTRY_AT = new Date("2026-08-10T12:00:00.000Z");
const EXIT_AT = new Date("2026-09-01T09:00:00.000Z");
const REENTRY_AT = new Date("2026-10-02T18:30:00.000Z");

const statusIdsByName = new Map([
  ["Em triagem", 3],
  ["Concluído", 16],
  ["Cancelado", 17],
]);

describe("replay de concluded_at pela Auditoria", () => {
  it("sem eventos devolve nulo e não inventa data", () => {
    expect(replayConcludedAt([])).toEqual({ concludedAt: null });
  });

  it("entrada no Status 16 grava o occurred_at", () => {
    expect(replayConcludedAt([{ occurredAt: ENTRY_AT, statusId: 16 }])).toEqual({
      concludedAt: ENTRY_AT,
    });
  });

  it("saída do Status 16 limpa a data", () => {
    expect(
      replayConcludedAt([
        { occurredAt: ENTRY_AT, statusId: 16 },
        { occurredAt: EXIT_AT, statusId: 3 },
      ]),
    ).toEqual({ concludedAt: null });
  });

  it("reentrada usa o occurred_at da última entrada", () => {
    expect(
      replayConcludedAt([
        { occurredAt: ENTRY_AT, statusId: 16 },
        { occurredAt: EXIT_AT, statusId: 17 },
        { occurredAt: REENTRY_AT, statusId: 16 },
      ]),
    ).toEqual({ concludedAt: REENTRY_AT });
  });

  it("status_change/override resolvem o Status pelo nome", () => {
    expect(
      resolveAuditEventStatusId(
        { action_type: "request.status_change", new_value: "Concluído" },
        statusIdsByName,
      ),
    ).toBe(16);
    expect(
      resolveAuditEventStatusId(
        { action_type: "request.override_status_admin", new_value: "Cancelado" },
        statusIdsByName,
      ),
    ).toBe(17);
    expect(
      resolveAuditEventStatusId(
        { action_type: "request.status_change", new_value: "Status removido" },
        statusIdsByName,
      ),
    ).toBeNull();
  });

  it("request.triage usa exitStatus do JSON e ignora o nome do Status", () => {
    const newValue = JSON.stringify({
      triageId: "00000000-0000-4000-8000-000000000000",
      exitStatus: 16,
      status: "Concluído",
    });

    expect(
      resolveAuditEventStatusId({ action_type: "request.triage", new_value: newValue }, new Map()),
    ).toBe(16);
    expect(
      resolveAuditEventStatusId(
        {
          action_type: "request.triage",
          new_value: JSON.stringify({ exitStatus: 3, status: "Concluído" }),
        },
        statusIdsByName,
      ),
    ).toBe(3);
  });

  it("evento de triagem ilegível é ignorado", () => {
    expect(
      resolveAuditEventStatusId(
        { action_type: "request.triage", new_value: "{não é json" },
        statusIdsByName,
      ),
    ).toBeNull();
    expect(
      resolveAuditEventStatusId(
        { action_type: "request.triage", new_value: JSON.stringify({ status: "Concluído" }) },
        statusIdsByName,
      ),
    ).toBeNull();
  });
});
