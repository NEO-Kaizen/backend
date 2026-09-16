import type { PrioritizationCriterion } from "./portalConfig.ts";

/**
 * Ponte entre as chaves do contrato `portal-config-api.md`
 * (`PRIORITIZATION_CRITERIA`, en) e os `criterion_id` da tabela `criteria`
 * (pt snake_case) — issue #51.
 */
export const CRITERION_KEY_TO_ID: Record<PrioritizationCriterion, string> = {
  operationalImpact: "impacto_operacional",
  operationalRisk: "risco_operacional",
  urgency: "urgencia",
  volumetry: "volumetria",
  manualEffort: "esforco_manual",
  clientImpact: "impacto_cliente",
  regulatoryDeadline: "prazo_regulatorio",
  affectedAreas: "areas_impactadas",
  strategicAlignment: "alinhamento_estrategico",
  estimatedComplexity: "complexidade_estimada",
};

export const CRITERION_ID_TO_KEY: Record<string, PrioritizationCriterion> = Object.fromEntries(
  Object.entries(CRITERION_KEY_TO_ID).map(([key, id]) => [id, key]),
) as Record<string, PrioritizationCriterion>;
