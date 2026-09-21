import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import { canonicalJson } from "../../shared/utils/json.ts";
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
interface Actor {
  id: number;
  role: string;
}

function isAdminOrAssignee(actor: Actor, assigneeUserId: number | null): boolean {
  if (actor.role === "Administrador") return true;
  if (assigneeUserId === null) return false;
  return assigneeUserId === actor.id;
}

export async function evaluateScore(
  protocol: string,
  payload: EvaluatePrioritizationRequest,
  actor: Actor,
): Promise<EvaluatePrioritizationResponse> {
  const exists = await repository.findRequestByProtocol(protocol);
  if (!exists) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const assigneeUserId = await repository.findAssigneeUserIdByProtocol(protocol);
  if (assigneeUserId === undefined) {
    throw new AppError("Solicitação não encontrada", 404);
  }
  if (!isAdminOrAssignee(actor, assigneeUserId)) {
    throw new AppError("Acesso negado a esta solicitação", 403);
  }

  const criteria = await repository.listActiveCriteria();
  assertActiveCriteriaCount(criteria);
  assertCompleteNotes(payload.notes, criteria);

  const score = calculateScore(payload.notes, criteria);
  const classification = await classify(score);

  const snapshot: EvaluationSnapshot = {
    notes: payload.notes,
    score,
    classification,
  };

  const evaluation = await db.transaction(async (trx) => {
    const previous = await repository.findCurrentEvaluationForShare(trx, protocol);
    const previousSnapshot: EvaluationSnapshot | null = previous
      ? {
          notes: previous.notes,
          score: previous.score,
          classification: previous.classification,
        }
      : null;

    const row = await repository.upsertEvaluation(trx, {
      protocol,
      notes: payload.notes,
      score,
      classification,
      calculatedBy: actor.id,
    });

    await recordAudit(trx, {
      entityType: "prioritization",
      entityId: protocol,
      actionType: "prioritization.evaluate",
      userId: actor.id,
      previousValue: previousSnapshot ? canonicalJson(previousSnapshot) : null,
      newValue: canonicalJson(snapshot),
      note: payload.justification ?? null,
      changeOrigin: "manual",
    });

    return row;
  });

  return {
    protocol,
    score: evaluation.score,
    classification: evaluation.classification,
    calculatedAt: evaluation.calculated_at.toISOString(),
    calculatedBy: evaluation.calculated_by,
  };
}

/**
 * Garante que os critérios ativos são exatamente os 10 oficiais da RN-007.
 * Configuração administrativa com contagem divergente recusa a avaliação para
 * não persistir scores incomparáveis historicamente.
 */
export function assertActiveCriteriaCount(criteria: CriterionRow[]): void {
  if (criteria.length !== 10) {
    throw new AppError(
      `Avaliação indisponível: esperados 10 critérios ativos (RN-007), encontrados ${criteria.length}.`,
      500,
    );
  }
}

/** Garante que as notas cobrem exatamente os critérios ativos. */
function assertCompleteNotes(notes: Record<string, number>, criteria: CriterionRow[]): void {
  const validIds = new Set(criteria.map((row) => row.criterion_id));

  const missing = criteria.filter((row) => notes[row.criterion_id] === undefined);
  if (missing.length > 0) {
    const list = limited(missing.map((row) => row.criterion_id));
    throw new AppError(`Notas obrigatórias ausentes: ${list}`, 400);
  }

  const unknown = Object.keys(notes).filter((key) => !validIds.has(key));
  if (unknown.length > 0) {
    throw new AppError(`Critérios inválidos: ${limited(unknown)}`, 400);
  }
}

/** Limita a lista ecoada em mensagens de erro (defesa contra payloads grandes). */
function limited(ids: string[]): string {
  const shown = ids.slice(0, 10).join(", ");
  return ids.length > 10 ? `${shown}… (+${ids.length - 10} mais)` : shown;
}

/** Média ponderada normalizada ×10 — RN-007 (issue-51). Resultado em 10..50. */
export function calculateScore(notes: Record<string, number>, criteria: CriterionRow[]): number {
  const somaPonderada = criteria.reduce(
    (acc, row) => acc + (notes[row.criterion_id] ?? 0) * row.weight,
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
    throw new AppError(`Nenhuma faixa de prioridade encontrada para o score ${score}`, 500);
  }
  return range.level;
}
