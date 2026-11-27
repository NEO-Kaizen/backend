import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { canonicalJson } from "../../shared/utils/json.ts";
import type {
  Classification,
  CriterionRow,
  EvaluationRow,
  PriorityRangeRow,
} from "../../shared/types/prioritization.ts";

/** Coluna DECIMAL do pg retorna string — normaliza para number uma vez (M1). */
function normalizeRow(row: EvaluationRow): EvaluationRow {
  return { ...row, score: Number(row.score) };
}

export async function findRequestByProtocol(protocol: string): Promise<boolean> {
  const row = await db("requests").where({ protocol }).first("protocol");
  return row !== undefined;
}

export async function findAssigneeUserIdByProtocol(
  protocol: string,
): Promise<number | null | undefined> {
  const row = await db("requests as r")
    .leftJoin("details_professional as dp", "dp.professional_id", "r.professional_id")
    .where("r.protocol", protocol)
    .first({ assigneeUserId: "dp.user_id" });
  if (!row) return undefined;
  return (row.assigneeUserId as number | null) ?? null;
}

export async function listActiveCriteria(): Promise<CriterionRow[]> {
  return db("criteria").where({ active: true }).orderBy("display_order", "asc");
}

/** Faixa RN-008 em que o score (arredondado) cai — lida da tabela `priorities`. */
export async function findRangeByScore(score: number): Promise<PriorityRangeRow | undefined> {
  const scoreRounded = Number(score.toFixed(1));
  return db("priorities")
    .where("min_score", "<=", scoreRounded)
    .andWhere("max_score", ">=", scoreRounded)
    .orderBy("min_score", "asc")
    .first();
}

/**
 * Última avaliação (estado atual) de um protocolo — nulo na 1ª avaliação.
 *
 * `FOR SHARE` na mesma transação do upsert: sob `READ COMMITTED`, a leitura é
 * reavaliada após o wait do lock e enxerga o valor commitado pela transação
 * concorrente — evita trilha de auditoria falsa em avaliações simultâneas.
 */
export async function findCurrentEvaluationForShare(
  trx: Knex.Transaction,
  protocol: string,
): Promise<EvaluationRow | undefined> {
  const row = await trx("prioritization_evaluations").where({ protocol }).forShare().first();
  return row ? normalizeRow(row) : undefined;
}

/** Upsert do estado atual, dentro da transação fornecida. */
export async function upsertEvaluation(
  trx: Knex.Transaction,
  evaluation: {
    protocol: string;
    notes: Record<string, number>;
    score: number;
    classification: Classification;
    calculatedBy: number;
  },
): Promise<EvaluationRow> {
  const data = {
    protocol: evaluation.protocol,
    notes: canonicalJson(evaluation.notes),
    score: evaluation.score,
    classification: evaluation.classification,
    calculated_by: evaluation.calculatedBy,
    calculated_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  };

  const rows = (await trx("prioritization_evaluations")
    .insert(data)
    .onConflict("protocol")
    .merge(data)
    .returning("*")) as EvaluationRow[];

  const row = rows[0];
  if (!row) {
    throw new Error("Falha ao salvar a avaliação.");
  }
  return normalizeRow(row);
}
