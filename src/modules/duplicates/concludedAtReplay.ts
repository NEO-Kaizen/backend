import type { StatusAuditAction } from "../../shared/audit/statusAuditActions.ts";
import { isCompletedStatus } from "../../shared/types/status.ts";

/**
 * Replay puro da Auditoria para o backfill de `requests.concluded_at`
 * (issue #210).
 *
 * A sequência recebida já vem ordenada por `occurred_at`/`audit_id`. Cada
 * evento representa o Status resultante da transição: entrar no 16 define a
 * data; qualquer saída limpa. O último evento vence.
 */
export interface ConcludedAtReplayEvent {
  occurredAt: Date;
  statusId: number;
}

export interface ConcludedAtReplayResult {
  concludedAt: Date | null;
}

export function replayConcludedAt(
  events: readonly ConcludedAtReplayEvent[],
): ConcludedAtReplayResult {
  let concludedAt: Date | null = null;

  for (const event of events) {
    concludedAt = isCompletedStatus(event.statusId) ? event.occurredAt : null;
  }

  return { concludedAt };
}

/** Evento mínimo da Auditoria que pode alterar o Status. */
export interface AuditEventForReplay {
  action_type: StatusAuditAction;
  new_value: string | null;
}

/**
 * `request.triage` usa `exitStatus` do JSON; os eventos do Motor usam o nome
 * do Status em `new_value`. Evento ilegível é ignorado (não vira fallback).
 */
export function resolveAuditEventStatusId(
  event: AuditEventForReplay,
  statusIdsByName: ReadonlyMap<string, number>,
): number | null {
  if (event.action_type === "request.triage") {
    return readTriageExitStatus(event.new_value);
  }

  if (event.new_value === null || event.new_value.trim() === "") {
    return null;
  }

  return statusIdsByName.get(event.new_value) ?? null;
}

function readTriageExitStatus(newValue: string | null): number | null {
  if (newValue === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(newValue);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;

  const { exitStatus } = parsed;
  return typeof exitStatus === "number" && Number.isInteger(exitStatus) ? exitStatus : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
