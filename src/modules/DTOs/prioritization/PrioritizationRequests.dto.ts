import type { Classification } from "../../../shared/types/prioritization.ts";

/** Corpo de `PUT /prioritization/:protocol/score`. */
export interface EvaluatePrioritizationRequest {
  notas: Record<string, number>;
  justificativa?: string;
}

/** Snapshot persistido no audit (notas + score + classificação). */
export interface EvaluationSnapshot {
  notas: Record<string, number>;
  score: number;
  classification: Classification;
}