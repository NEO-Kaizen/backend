import type { DuplicateConfidence } from "../../shared/types/duplicates.ts";

/**
 * Regra de faixa do Alerta de duplicidade (issue #209).
 *
 * A similaridade bruta do motor (BM25 no MiniSearch) é normalizada para
 * `score / (score + 1)` antes de comparar com o piso, para que a regra seja
 * portável entre motores. O piso é provisório até a calibração da issue #213.
 */
export interface DuplicateConfidenceConfig {
  readonly version: string;
  readonly floor: number;
  readonly margin: number;
}

/**
 * Configuração versionada e injetável: a calibração da issue #213 pode passar
 * um conjunto próprio sem alterar a regra, mantendo o valor provisório como
 * default.
 */
export const DUPLICATE_CONFIDENCE_CONFIG = {
  version: "provisional-v1",
  floor: 0.34,
  margin: 1.15,
} as const satisfies DuplicateConfidenceConfig;

/** Normaliza a similaridade bruta do motor para o intervalo [0, 1). */
export function normalizeSimilarityScore(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return score / (score + 1);
}

/**
 * Classifica a faixa a partir dos scores brutos já ordenados do melhor para o
 * pior (`hits[0]` é o topo). Sem candidatos, a faixa é `none`.
 */
export function classifyDuplicateConfidence(
  scores: readonly number[],
  config: DuplicateConfidenceConfig = DUPLICATE_CONFIDENCE_CONFIG,
): DuplicateConfidence {
  const top = scores[0];

  if (top === undefined) return "none";

  const normalizedTop = normalizeSimilarityScore(top);
  if (normalizedTop < config.floor) return "none";

  const second = scores[1];
  const normalizedSecond = second === undefined ? 0 : normalizeSimilarityScore(second);
  const marginSatisfied =
    normalizedSecond === 0 || normalizedTop >= config.margin * normalizedSecond;

  return marginSatisfied ? "high" : "medium";
}
