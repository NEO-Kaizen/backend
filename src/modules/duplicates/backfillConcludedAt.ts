import db from "../../database/conection.ts";
import {
  listCompletedRequestsMissingConcludedAt,
  listStatusAuditEventsForProtocols,
  listStatusIdsByName,
  setConcludedAtIfMissing,
  type CompletedRequestCandidate,
  type StatusAuditEvent,
} from "./backfillConcludedAt.repository.ts";
import {
  replayConcludedAt,
  resolveAuditEventStatusId,
  type ConcludedAtReplayResult,
} from "./concludedAtReplay.ts";
import { getDuplicateCompletedWindowMonths } from "./duplicates.repository.ts";
import { publishRequestProjection } from "./projection.ts";

/**
 * Backfill de `requests.concluded_at` a partir da Auditoria (issue #210).
 *
 * Reproduz a sequência de Status de cada Solicitação concluída sem a data:
 * entrada no 16 grava o `occurred_at`; saída limpa. Não usa `updated_at` como
 * fallback, não cria projeção para quem não tem evento e é idempotente — só
 * atualiza `status_id = 16 AND concluded_at IS NULL`, republicando a projeção
 * na mesma transação.
 *
 * O processamento é em lotes de `BACKFILL_BATCH_SIZE`, com uma transação por
 * lote e uma única leitura de Auditoria por `whereIn`. A janela é lida uma vez
 * e reaproveitada em todas as publicações do lote.
 */
export const BACKFILL_BATCH_SIZE = 100;

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
  /** Candidatas cujo Status deixou de ser 16 entre a leitura e o update. */
  skipped: string[];
}

function replayFromEvents(
  events: readonly StatusAuditEvent[],
  statusIdsByName: ReadonlyMap<string, number>,
): ConcludedAtReplayResult {
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
    skipped: [],
  };

  if (candidates.length === 0) return report;

  const statusIdsByName = await listStatusIdsByName();
  const windowMonths = await getDuplicateCompletedWindowMonths();

  for (let start = 0; start < candidates.length; start += BACKFILL_BATCH_SIZE) {
    const batch = candidates.slice(start, start + BACKFILL_BATCH_SIZE);
    const protocols = batch.map((candidate) => candidate.protocol);

    if (dryRun) {
      const eventsByProtocol = await listStatusAuditEventsForProtocols(protocols);
      recordDryRunBatch(batch, eventsByProtocol, statusIdsByName, report);
      continue;
    }

    await db.transaction(async (trx) => {
      const eventsByProtocol = await listStatusAuditEventsForProtocols(protocols, trx);

      for (const candidate of batch) {
        const replay = replayFromEvents(
          eventsByProtocol.get(candidate.protocol) ?? [],
          statusIdsByName,
        );

        if (!replay.concludedAt) {
          report.withoutEvent.push(candidate.protocol);
          continue;
        }

        const didUpdate = await setConcludedAtIfMissing(
          trx,
          candidate.request_id,
          replay.concludedAt,
        );

        if (!didUpdate) {
          report.skipped.push(candidate.protocol);
          continue;
        }

        await publishRequestProjection(trx, candidate.request_id, windowMonths);
        report.updated.push(candidate.protocol);
      }
    });
  }

  return report;
}

function recordDryRunBatch(
  batch: readonly CompletedRequestCandidate[],
  eventsByProtocol: ReadonlyMap<string, StatusAuditEvent[]>,
  statusIdsByName: ReadonlyMap<string, number>,
  report: BackfillConcludedAtReport,
): void {
  for (const candidate of batch) {
    const replay = replayFromEvents(
      eventsByProtocol.get(candidate.protocol) ?? [],
      statusIdsByName,
    );

    if (replay.concludedAt) {
      report.updated.push(candidate.protocol);
    } else {
      report.withoutEvent.push(candidate.protocol);
    }
  }
}
