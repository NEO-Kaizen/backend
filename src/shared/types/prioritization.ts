/** Linha da tabela `criteria`. */
export interface CriterionRow {
  criterion_id: string;
  name: string;
  weight: number;
  active: boolean;
  display_order: number;
}

/**
 * Classificação RN-008 — vocabulário do produto e da tabela `requests`
 * (enum nativo `request_priority`).
 */
export type Classification = "Baixa" | "Média" | "Alta" | "Crítica";

/** Faixa de prioridade lida da tabela `priorities`. */
export interface PriorityRangeRow {
  priority_id: number;
  level: Classification;
  min_score: number;
  max_score: number;
}

/** Linha de `prioritization_evaluations` — estado atual da priorização. */
export interface EvaluationRow {
  protocol: string;
  notes: Record<string, number>;
  score: number;
  classification: Classification;
  calculated_by: number;
  calculated_at: Date;
}