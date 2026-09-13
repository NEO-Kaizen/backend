import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type { Classification, CriterionRow } from "../../shared/types/prioritization.ts";
import type {
  EvaluatePrioritizationRequest,
  EvaluationSnapshot,
} from "../DTOs/prioritization/PrioritizationRequests.dto.ts";
import type {
  CriterionResponse,
  EvaluatePrioritizationResponse,
  ListCriteriaResponse,
} from "../DTOs/prioritization/PrioritizationResponse.dto.ts";
import * as repository from "./prioritization.repository.ts";

export async function listActiveCriteria(): Promise<ListCriteriaResponse> {
  const rows = await repository.listActiveCriteria();
  const criteria: CriterionResponse[] = rows.map((row) => ({
    id: row.criterion_id,
    name: row.name,
    weight: row.weight,
  }));
  return { criteria };
}

/**
 * Avalia a priorização de uma solicitação (RN-007 / issue-51) e persiste na
 * mesma transação: estado atual (`prioritization_evaluations`) + trilha
 * imutável (`audit_history`, evento `prioritization.evaluate`, com snapshot
 * anterior e novo).
 */
export async function evaluateScore(
  protocol: string,
  payload: EvaluatePrioritizationRequest,
  actorUserId: number,
): Promise<EvaluatePrioritizationResponse> {
  const exists = await repository.findRequestByProtocol(protocol);
  if (!exists) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const criteria = await repository.listActiveCriteria();
  assertCompleteNotes(payload.notas, criteria);

  const score = calculateScore(payload.notas, criteria);
  const classification = await classify(score);

  const snapshot: EvaluationSnapshot = {
    notas: payload.notas,
    score,
    classification,
  };

  const previous = await repository.findCurrentEvaluation(protocol);
  const previousSnapshot: EvaluationSnapshot | null = previous
    ? {
        notas: previous.notes,
        score: Number(previous.score),
        classification: previous.classification,
      }
    : null;

  const evaluation = await db.transaction(async (trx) => {
    const row = await repository.upsertEvaluation(trx, {
      protocol,
      notes: payload.notas,
      score,
      classification,
      calculatedBy: actorUserId,
    });

    await recordAudit(trx, {
      entityType: "prioritization",
      entityId: protocol,
      actionType: "prioritization.evaluate",
      userId: actorUserId,
      previousValue: previousSnapshot ? JSON.stringify(previousSnapshot) : null,
      newValue: JSON.stringify(snapshot),
      note: payload.justificativa ?? null,
      changeOrigin: "manual",
    });

    return row;
  });

  return {
    protocol,
    score: Number(evaluation.score),
    classification: evaluation.classification,
    calculatedAt: evaluation.calculated_at.toISOString(),
    calculatedBy: evaluation.calculated_by,
  };
}

/** Garante que as notas cobrem exatamente os critérios ativos. */
function assertCompleteNotes(
  notas: Record<string, number>,
  criteria: CriterionRow[],
): void {
  const validIds = new Set(criteria.map((row) => row.criterion_id));

  const missing = criteria.filter((row) => notas[row.criterion_id] === undefined);
  if (missing.length > 0) {
    const list = missing.map((row) => row.criterion_id).join(", ");
    throw new AppError(`Notas obrigatórias ausentes: ${list}`, 400);
  }

  const unknown = Object.keys(notas).filter((key) => !validIds.has(key));
  if (unknown.length > 0) {
    throw new AppError(`Critérios inválidos: ${unknown.join(", ")}`, 400);
  }
}

/** Média ponderada normalizada ×10 — RN-007 (issue-51). Resultado em 10..50. */
export function calculateScore(
  notas: Record<string, number>,
  criteria: CriterionRow[],
): number {
  const somaPonderada = criteria.reduce(
    (acc, row) => acc + (notas[row.criterion_id] ?? 0) * row.weight,
    0,
  );
  const somaPesos = criteria.reduce((acc, row) => acc + row.weight, 0);

  if (somaPesos <= 0) {
    throw new AppError("Soma dos pesos dos critérios deve ser maior que zero", 500);
  }

  return Number(((somaPonderada / somaPesos) * 10).toFixed(1));
}

/** Deriva a classificação RN-008 lendo as faixas da tabela `priorities`. */
async function classify(score: number): Promise<Classification> {
  const range = await repository.findRangeByScore(score);
  if (!range) {
    throw new AppError(
      `Nenhuma faixa de prioridade encontrada para o score ${score}`,
      500,
    );
  }
  return range.level;
}