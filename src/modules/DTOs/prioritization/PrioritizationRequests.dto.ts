import type { Classification } from "../../../shared/types/prioritization.ts";

/** Corpo de `PUT /prioritization/:protocol/score`. */
export interface EvaluatePrioritizationRequest {
  notes: Record<string, number>;
  justification?: string;
}

/** Snapshot persistido no audit (notas + score + classificação). */
export interface EvaluationSnapshot {
  notes: Record<string, number>;
  score: number;
  classification: Classification;
}
