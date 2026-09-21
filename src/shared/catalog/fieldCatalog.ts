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

export const FIELD_KEY_SET = new Set<string>(FIELD_KEYS as unknown as string[]);

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
  return FIELD_LABELS[fieldKey as FieldKey] ?? fieldKey;
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
      return row.requester_name as string;
    case "requester.corporateEmail":
      return row.requester_email as string;
    case "requester.area":
      return (row.requester_area as string | null) ?? "";
    case "requester.department":
      return (row.requester_department as string | null) ?? null;
    case "requester.manager":
      return (row.requester_manager as string | null) ?? "";
    case "requester.additionalContact":
      return (row.requester_additional_contact as string | null) ?? null;
    case "demand.title":
      return row.title as string;
    case "demand.requestType":
      return row.request_type as string;
    case "demand.category":
      return (row.category as string) ?? (row.category_name as string) ?? "";
    case "demand.processName":
      return row.process_name as string;
    case "demand.description":
      return row.need_description as string;
    case "demand.problem":
      return row.problem_opportunity as string;
    case "demand.expectedResult":
      return row.expected_result as string;
    case "demand.justification":
      return row.justification as string;
    case "operational.processDescription":
      return row.process_description as string;
    case "operational.processSteps":
      return row.process_steps as string;
    case "operational.systemsUsed":
      return row.systems_used as string;
    case "operational.executionFrequency":
      return row.execution_frequency as string;
    case "operational.volumetry":
      return row.approximate_volume as string;
    case "operational.peopleInvolved":
      return row.people_involved as number;
    case "operational.averageExecutionTime":
      return row.average_duration as string;
    case "operational.monthlyEffortHours":
      return Number(row.estimated_monthly_effort);
    case "operational.hasManualControls": {
      const flag = row.has_manual_controls as boolean;
      const detail = row.manual_controls_detail as string | null;
      return toYesNoDetailString(flag, detail) as string | boolean | null;
    }
    case "operational.mainRisks":
      return row.main_risks as string;
    case "operational.clientImpact":
      return row.client_impact as string;
    case "operational.operationalImpact":
      return row.operational_impact as string;
    case "operational.desiredDeadline": {
      const v = row.desired_deadline as string | Date;
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      return d.toISOString().slice(0, 10);
    }
    case "operational.perceivedCriticality":
      return row.perceived_criticality as string;
    case "complementary.hasProcessDocumentation":
      return toYesNoDetailString(
        row.has_process_documentation as boolean | null,
        row.process_documentation_detail as string | null,
      ) as string | boolean | null;
    case "complementary.hasSimilarSolution":
      return toYesNoDetailString(
        row.has_similar_solution as boolean | null,
        row.similar_solution_detail as string | null,
      ) as string | boolean | null;
    case "complementary.dependsOnOtherAreas":
      return toYesNoDetailString(
        row.depends_on_other_areas as boolean | null,
        row.other_areas_detail as string | null,
      ) as string | boolean | null;
    case "complementary.handlesRestrictedInfo":
      return toYesNoDetailString(
        row.handles_restricted_info as boolean | null,
        row.restricted_info_detail as string | null,
      ) as string | boolean | null;
    case "complementary.additionalNotes":
      return (row.additional_notes as string | null) ?? null;
    default:
      return null;
  }
}

export function getFieldSnapshot(
  fieldKey: string,
  row: InternalRequestRow,
): { label: string; value: string | number | boolean | null } {
  const normalized = fieldKey as FieldKey;
  return {
    label: getFieldLabel(normalized),
    value: extractCurrentValue(normalized, row),
  };
}
