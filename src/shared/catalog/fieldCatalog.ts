// Catálogo whole-app das 33 chaves marcáveis (espelho de shared/types/requests.ts).
// Fonte única de FIELD_KEYS / FIELD_LABELS / getFieldSnapshot — usado por pendências
// para validar `fieldKey` e derivar `fieldLabel`/`currentValue` no snapshot.
import type { InternalRequestRow } from "../types/requests.ts";

export const FIELD_KEYS = [
  "requester.fullName",
  "requester.corporateEmail",
  "requester.area",
  "requester.department",
  "requester.manager",
  "requester.additionalContact",
  "demand.title",
  "demand.requestType",
  "demand.category",
  "demand.processName",
  "demand.description",
  "demand.problem",
  "demand.expectedResult",
  "demand.justification",
  "operational.processDescription",
  "operational.processSteps",
  "operational.systemsUsed",
  "operational.executionFrequency",
  "operational.volumetry",
  "operational.peopleInvolved",
  "operational.averageExecutionTime",
  "operational.monthlyEffortHours",
  "operational.hasManualControls",
  "operational.mainRisks",
  "operational.clientImpact",
  "operational.operationalImpact",
  "operational.desiredDeadline",
  "operational.perceivedCriticality",
  "complementary.hasProcessDocumentation",
  "complementary.hasSimilarSolution",
  "complementary.dependsOnOtherAreas",
  "complementary.handlesRestrictedInfo",
  "complementary.additionalNotes",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_KEY_LOOKUP: ReadonlySet<string> = new Set(FIELD_KEYS);

/** Estreita `string` para `FieldKey` — use na borda antes de chamar o catálogo. */
export function isFieldKey(value: string): value is FieldKey {
  return FIELD_KEY_LOOKUP.has(value);
}

export const FIELD_LABELS: Record<FieldKey, string> = {
  "requester.fullName": "Nome completo",
  "requester.corporateEmail": "E-mail corporativo",
  "requester.area": "Área",
  "requester.department": "Departamento",
  "requester.manager": "Gestor responsável",
  "requester.additionalContact": "Contato adicional",
  "demand.title": "Título resumido",
  "demand.requestType": "Tipo de solicitação",
  "demand.category": "Categoria",
  "demand.processName": "Nome do processo",
  "demand.description": "Descrição da necessidade",
  "demand.problem": "Problema/oportunidade",
  "demand.expectedResult": "Resultado esperado",
  "demand.justification": "Justificativa",
  "operational.processDescription": "Descrição do processo atual",
  "operational.processSteps": "Etapas do processo",
  "operational.systemsUsed": "Sistemas utilizados",
  "operational.executionFrequency": "Frequência de execução",
  "operational.volumetry": "Volumetria",
  "operational.peopleInvolved": "Pessoas envolvidas",
  "operational.averageExecutionTime": "Tempo médio por ciclo",
  "operational.monthlyEffortHours": "Esforço mensal (horas)",
  "operational.hasManualControls": "Controles manuais",
  "operational.mainRisks": "Principais riscos",
  "operational.clientImpact": "Impacto no cliente",
  "operational.operationalImpact": "Impacto operacional",
  "operational.desiredDeadline": "Prazo desejado",
  "operational.perceivedCriticality": "Criticidade percebida",
  "complementary.hasProcessDocumentation": "Documentação do processo",
  "complementary.hasSimilarSolution": "Solução semelhante",
  "complementary.dependsOnOtherAreas": "Dependência de outras áreas",
  "complementary.handlesRestrictedInfo": "Informação restrita (LGPD)",
  "complementary.additionalNotes": "Observações adicionais",
};

export function getFieldLabel(fieldKey: string): string {
  return isFieldKey(fieldKey) ? FIELD_LABELS[fieldKey] : fieldKey;
}

function assertNever(value: never): never {
  throw new Error(`FieldKey não tratado: ${String(value)}`);
}

function toYesNoDetailString(
  hasFlag: boolean | null,
  detail: string | null,
): string | boolean | null {
  if (hasFlag === null || hasFlag === undefined) return null;
  if (hasFlag === false) return false;
  return detail ?? "";
}

function extractCurrentValue(
  fieldKey: FieldKey,
  row: InternalRequestRow,
): string | number | boolean | null {
  switch (fieldKey) {
    case "requester.fullName":
      return row.requester_name;
    case "requester.corporateEmail":
      return row.requester_email;
    case "requester.area":
      return row.requester_area ?? "";
    case "requester.department":
      return row.requester_department ?? null;
    case "requester.manager":
      return row.requester_manager ?? "";
    case "requester.additionalContact":
      return row.requester_additional_contact ?? null;
    case "demand.title":
      return row.title;
    case "demand.requestType":
      return row.request_type;
    case "demand.category":
      return row.category ?? "";
    case "demand.processName":
      return row.process_name;
    case "demand.description":
      return row.need_description;
    case "demand.problem":
      return row.problem_opportunity;
    case "demand.expectedResult":
      return row.expected_result;
    case "demand.justification":
      return row.justification;
    case "operational.processDescription":
      return row.process_description;
    case "operational.processSteps":
      return row.process_steps;
    case "operational.systemsUsed":
      return row.systems_used;
    case "operational.executionFrequency":
      return row.execution_frequency;
    case "operational.volumetry":
      return row.approximate_volume;
    case "operational.peopleInvolved":
      return row.people_involved;
    case "operational.averageExecutionTime":
      return row.average_duration;
    case "operational.monthlyEffortHours":
      return Number(row.estimated_monthly_effort);
    case "operational.hasManualControls":
      return toYesNoDetailString(row.has_manual_controls, row.manual_controls_detail);
    case "operational.mainRisks":
      return row.main_risks;
    case "operational.clientImpact":
      return row.client_impact;
    case "operational.operationalImpact":
      return row.operational_impact;
    case "operational.desiredDeadline": {
      const value = row.desired_deadline;
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      return date.toISOString().slice(0, 10);
    }
    case "operational.perceivedCriticality":
      return row.perceived_criticality;
    case "complementary.hasProcessDocumentation":
      return toYesNoDetailString(row.has_process_documentation, row.process_documentation_detail);
    case "complementary.hasSimilarSolution":
      return toYesNoDetailString(row.has_similar_solution, row.similar_solution_detail);
    case "complementary.dependsOnOtherAreas":
      return toYesNoDetailString(row.depends_on_other_areas, row.other_areas_detail);
    case "complementary.handlesRestrictedInfo":
      return toYesNoDetailString(row.handles_restricted_info, row.restricted_info_detail);
    case "complementary.additionalNotes":
      return row.additional_notes ?? null;
    default:
      return assertNever(fieldKey);
  }
}

export function getFieldSnapshot(
  fieldKey: FieldKey,
  row: InternalRequestRow,
): { label: string; value: string | number | boolean | null } {
  return {
    label: getFieldLabel(fieldKey),
    value: extractCurrentValue(fieldKey, row),
  };
}
