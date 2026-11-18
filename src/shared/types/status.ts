/**
 * Ids do seed canônico de status.
 *
 * Fonte: Anexo A de `docs/portal-config-statuses-amend.md` (17 linhas).
 * Estes ids são estáveis; APENAS os nomes dos status não-core podem ser
 * alterados pelo Administrador. Regras de negócio devem comparar por id
 * (ou por flags da tabela `statuses`), nunca por nome.
 */
export const STATUS_IDS = {
  requestSent: 1,
  awaitingTriage: 2,
  inTriage: 3,
  pendingInformation: 4,
  awaitingMapping: 5,
  mappingScheduled: 6,
  inMapping: 7,
  viabilityAnalysis: 8,
  eligible: 9,
  notEligible: 10,
  prioritized: 11,
  backlog: 12,
  forwardedToOtherArea: 13,
  inDevelopment: 14,
  inHomologation: 15,
  completed: 16,
  canceled: 17,
} as const;

export type StatusId = (typeof STATUS_IDS)[keyof typeof STATUS_IDS];

/** Status protegidos contra renomeação, remoção e desativação. */
export const CORE_STATUS_IDS = [
  STATUS_IDS.requestSent,
  STATUS_IDS.inTriage,
  STATUS_IDS.pendingInformation,
  STATUS_IDS.mappingScheduled,
  STATUS_IDS.inMapping,
  STATUS_IDS.completed,
  STATUS_IDS.canceled,
] as const satisfies readonly StatusId[];

export type CoreStatusId = (typeof CORE_STATUS_IDS)[number];

/**
 * Status que contam como "em andamento" nas métricas da fila.
 *
 * Definidos por id (estável), não por nome (renomeável). A lista é a mesma
 * atualmente usada por `IN_PROGRESS_STATUSES` em `requests.ts`; a decisão de
 * produto sobre incluir novos status automaticamente exige uma flag no banco
 * (ver Q8 na auditoria de tipagem).
 */
export const IN_PROGRESS_STATUS_IDS = [
  STATUS_IDS.inTriage,
  STATUS_IDS.inMapping,
  STATUS_IDS.viabilityAnalysis,
  STATUS_IDS.inDevelopment,
  STATUS_IDS.inHomologation,
] as const satisfies readonly StatusId[];
