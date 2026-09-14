import type { Classification } from "../../../shared/types/prioritization.ts";

/** Item de `GET /prioritization/criteria`. */
export interface CriterionResponse {
  id: string;
  name: string;
  weight: number;
}

/** Resposta de `GET /prioritization/criteria`. */
export interface ListCriteriaResponse {
  criteria: CriterionResponse[];
}

/** Resposta de `PUT /prioritization/:protocol/score`. */
export interface EvaluatePrioritizationResponse {
  protocol: string;
  score: number;
  classification: Classification;
  calculatedAt: string;
  calculatedBy: number;
}