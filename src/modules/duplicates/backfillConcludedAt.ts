import type { Knex } from "knex";
import db from "../../database/conection.ts";
import {
  warnDuplicateCompletedWindowFallback,
  type DuplicateCompletedWindow,
} from "./completedWindow.ts";
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

type BackfillBatchOutcome = Pick<BackfillConcludedAtReport, "updated" | "withoutEvent" | "skipped">;

interface ResolvedCandidateConclusion {
  request_id: string;
  protocol: string;
  concludedAt: Date | null;
}

interface ConcludedCandidate {
  request_id: string;
  protocol: string;
  concludedAt: Date;
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
): ResolvedCandidateConclusion {
  const replay = replayFromEvents(eventsByProtocol.get(candidate.protocol) ?? [], statusIdsByName);

  return {
    request_id: candidate.request_id,
    protocol: candidate.protocol,
    concludedAt: replay.concludedAt,
  };
}

function resolveBatchConclusions(
  batch: readonly CompletedRequestCandidate[],
  eventsByProtocol: ReadonlyMap<string, StatusAuditEvent[]>,
  statusIdsByName: ReadonlyMap<string, number>,
): ResolvedCandidateConclusion[] {
  return batch.map((candidate) =>
    resolveCandidateConclusion(candidate, eventsByProtocol, statusIdsByName),
  );
}

/**
 * Separa as candidatas com conclusão vigente das que não têm evento. O ramo
 * comum evita repetir a classificação entre dry-run e execução real.
 */
function splitResolvedConclusions(conclusions: readonly ResolvedCandidateConclusion[]): {
  concluded: ConcludedCandidate[];
  withoutEvent: string[];
} {
  const concluded: ConcludedCandidate[] = [];
  const withoutEvent: string[] = [];

  for (const conclusion of conclusions) {
    if (conclusion.concludedAt) {
      concluded.push({
        request_id: conclusion.request_id,
        protocol: conclusion.protocol,
        concludedAt: conclusion.concludedAt,
      });
    } else {
      withoutEvent.push(conclusion.protocol);
    }
  }

  return { concluded, withoutEvent };
}

function classifyDryRunBatch(
  batch: readonly CompletedRequestCandidate[],
  eventsByProtocol: ReadonlyMap<string, StatusAuditEvent[]>,
  statusIdsByName: ReadonlyMap<string, number>,
): BackfillBatchOutcome {
  const outcome = createBatchOutcome();
  const { concluded, withoutEvent } = splitResolvedConclusions(
    resolveBatchConclusions(batch, eventsByProtocol, statusIdsByName),
  );

  outcome.updated.push(...concluded.map((candidate) => candidate.protocol));
  outcome.withoutEvent.push(...withoutEvent);

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
  const { concluded, withoutEvent } = splitResolvedConclusions(
    resolveBatchConclusions(batch, eventsByProtocol, statusIdsByName),
  );

  outcome.withoutEvent.push(...withoutEvent);

  for (const candidate of concluded) {
    const didUpdate = await setConcludedAtIfMissing(
      trx,
      candidate.request_id,
      candidate.concludedAt,
    );

    if (!didUpdate) {
      outcome.skipped.push(candidate.protocol);
      continue;
    }

    await publishRequestProjection(trx, candidate.request_id, window);
    outcome.updated.push(candidate.protocol);
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
    ...createBatchOutcome(),
  };

  if (candidates.length === 0) return report;

  const statusIdsByName = await listStatusIdsByName();
  const window = await getDuplicateCompletedWindow({
    onFallback: warnDuplicateCompletedWindowFallback,
  });

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
