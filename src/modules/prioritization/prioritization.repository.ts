import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type {
  Classification,
  CriterionRow,
  EvaluationRow,
  PriorityRangeRow,
} from "../../shared/types/prioritization.ts";

export async function findRequestByProtocol(protocol: string): Promise<boolean> {
  const row = await db("requests").where({ protocol }).first("protocol");
  return row !== undefined;
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
    .first();
}

/** Última avaliação (estado atual) de um protocolo — nulo na 1ª avaliação. */
export async function findCurrentEvaluation(
  protocol: string,
): Promise<EvaluationRow | undefined> {
  return db("prioritization_evaluations").where({ protocol }).first();
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
    notes: JSON.stringify(evaluation.notes),
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
  return row;
}