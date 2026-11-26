import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { DuplicateCompletedWindow } from "../../shared/types/systemSettings.ts";
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
import { getDuplicateCompletedWindow } from "./duplicates.repository.ts";
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
 * e reaproveitada em todas as publicações do lote. As contagens do lote só
 * entram no relatório depois que a transação commita.
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

interface BackfillBatchOutcome {
  updated: string[];
  withoutEvent: string[];
  skipped: string[];
}

function createBatchOutcome(): BackfillBatchOutcome {
  return { updated: [], withoutEvent: [], skipped: [] };
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

/**
 * Ponto comum entre o dry-run e o processamento real: resolve a conclusão
 * vigente de uma candidata a partir dos eventos já carregados do lote.
 */
function resolveCandidateConclusion(
  candidate: CompletedRequestCandidate,
  eventsByProtocol: ReadonlyMap<string, StatusAuditEvent[]>,
  statusIdsByName: ReadonlyMap<string, number>,
): { protocol: string; concludedAt: Date | null } {
  const replay = replayFromEvents(eventsByProtocol.get(candidate.protocol) ?? [], statusIdsByName);

  return { protocol: candidate.protocol, concludedAt: replay.concludedAt };
}

function classifyDryRunBatch(
  batch: readonly CompletedRequestCandidate[],
  eventsByProtocol: ReadonlyMap<string, StatusAuditEvent[]>,
  statusIdsByName: ReadonlyMap<string, number>,
): BackfillBatchOutcome {
  const outcome = createBatchOutcome();

  for (const candidate of batch) {
    const { protocol, concludedAt } = resolveCandidateConclusion(
      candidate,
      eventsByProtocol,
      statusIdsByName,
    );

    if (concludedAt) {
      outcome.updated.push(protocol);
    } else {
      outcome.withoutEvent.push(protocol);
    }
  }

  return outcome;
}

async function processBackfillBatch(
  trx: Knex.Transaction,
  batch: readonly CompletedRequestCandidate[],
  eventsByProtocol: ReadonlyMap<string, StatusAuditEvent[]>,
  statusIdsByName: ReadonlyMap<string, number>,
  window: DuplicateCompletedWindow,
): Promise<BackfillBatchOutcome> {
  const outcome = createBatchOutcome();

  for (const candidate of batch) {
    const { protocol, concludedAt } = resolveCandidateConclusion(
      candidate,
      eventsByProtocol,
      statusIdsByName,
    );

    if (!concludedAt) {
      outcome.withoutEvent.push(protocol);
      continue;
    }

    const didUpdate = await setConcludedAtIfMissing(trx, candidate.request_id, concludedAt);

    if (!didUpdate) {
      outcome.skipped.push(protocol);
      continue;
    }

    await publishRequestProjection(trx, candidate.request_id, window);
    outcome.updated.push(protocol);
  }

  return outcome;
}

function mergeBatchOutcome(report: BackfillConcludedAtReport, outcome: BackfillBatchOutcome): void {
  report.updated.push(...outcome.updated);
  report.withoutEvent.push(...outcome.withoutEvent);
  report.skipped.push(...outcome.skipped);
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
  const window = await getDuplicateCompletedWindow();

  for (let start = 0; start < candidates.length; start += BACKFILL_BATCH_SIZE) {
    const batch = candidates.slice(start, start + BACKFILL_BATCH_SIZE);
    const protocols = batch.map((candidate) => candidate.protocol);

    if (dryRun) {
      const eventsByProtocol = await listStatusAuditEventsForProtocols(protocols);
      mergeBatchOutcome(report, classifyDryRunBatch(batch, eventsByProtocol, statusIdsByName));
      continue;
    }

    const outcome = await db.transaction(async (trx) => {
      const eventsByProtocol = await listStatusAuditEventsForProtocols(protocols, trx);
      return processBackfillBatch(trx, batch, eventsByProtocol, statusIdsByName, window);
    });

    mergeBatchOutcome(report, outcome);
  }

  return report;
}
