import type { Knex } from "knex";
import db from "../../database/conection.ts";
import {
  listCompletedRequestsMissingConcludedAt,
  listStatusAuditEvents,
  listStatusIdsByName,
  setConcludedAtIfMissing,
  type CompletedRequestCandidate,
} from "./backfillConcludedAt.repository.ts";
import {
  replayConcludedAt,
  resolveAuditEventStatusId,
  type ConcludedAtReplayResult,
} from "./concludedAtReplay.ts";
import { publishRequestProjection } from "./projection.ts";

export { replayConcludedAt, resolveAuditEventStatusId };
export type { ConcludedAtReplayEvent, ConcludedAtReplayResult } from "./concludedAtReplay.ts";

/**
 * Backfill de `requests.concluded_at` a partir da Auditoria (issue #210).
 *
 * Reproduz a sequência de Status de cada Solicitação concluída sem a data:
 * entrada no 16 grava o `occurred_at`; saída limpa. Não usa `updated_at` como
 * fallback, não cria projeção para quem não tem evento e é idempotente — só
 * atualiza `status_id = 16 AND concluded_at IS NULL`, republicando a projeção
 * na mesma transação.
 */
export interface BackfillConcludedAtOptions {
  dryRun?: boolean;
}

export interface BackfillConcludedAtReport {
  dryRun: boolean;
  scanned: number;
  /** Protocolos atualizados; em `dryRun`, os que seriam atualizados. */
  updated: string[];
  /** Concluídas sem evento de entrada vigente; nenhuma projeção é criada. */
  withoutEvent: string[];
}

async function replayCandidate(
  candidate: CompletedRequestCandidate,
  statusIdsByName: ReadonlyMap<string, number>,
  trx?: Knex.Transaction,
): Promise<ConcludedAtReplayResult> {
  const events = await listStatusAuditEvents(candidate.protocol, trx);
  const replayEvents = events.flatMap((event) => {
    const statusId = resolveAuditEventStatusId(event, statusIdsByName);
    return statusId === null ? [] : [{ occurredAt: event.occurred_at, statusId }];
  });

  return replayConcludedAt(replayEvents);
}

export async function backfillConcludedAt(
  options: BackfillConcludedAtOptions = {},
): Promise<BackfillConcludedAtReport> {
  const dryRun = options.dryRun ?? false;
  const candidates = await listCompletedRequestsMissingConcludedAt();
  const report: BackfillConcludedAtReport = {
    dryRun,
    scanned: candidates.length,
    updated: [],
    withoutEvent: [],
  };

  if (candidates.length === 0) return report;

  const statusIdsByName = await listStatusIdsByName();

  for (const candidate of candidates) {
    if (dryRun) {
      const replay = await replayCandidate(candidate, statusIdsByName);
      if (replay.concludedAt) {
        report.updated.push(candidate.protocol);
      } else {
        report.withoutEvent.push(candidate.protocol);
      }
      continue;
    }

    const outcome = await db.transaction(async (trx) => {
      const replay = await replayCandidate(candidate, statusIdsByName, trx);

      if (!replay.concludedAt) {
        return "without_event" as const;
      }

      const didUpdate = await setConcludedAtIfMissing(
        trx,
        candidate.request_id,
        replay.concludedAt,
      );

      if (!didUpdate) {
        return "skipped" as const;
      }

      await publishRequestProjection(trx, candidate.request_id);
      return "updated" as const;
    });

    if (outcome === "updated") {
      report.updated.push(candidate.protocol);
    } else if (outcome === "without_event") {
      report.withoutEvent.push(candidate.protocol);
    }
  }

  return report;
}
