/**
 * Ids dos status core do seed canônico.
 *
 * Fonte: Anexo A de `docs/portal-config-statuses-amend.md` (ids 1, 3, 4, 6, 7,
 * 16 e 17). Apenas os status core são expostos aqui: os não-core podem ser
 * renomeados, desativados ou ter `triage_mode`/`mapping_mode` alterados pelo
 * Administrador, então não servem como referência de regra de negócio. Para
 * comportamentos dependentes de não-core, use as flags da tabela `statuses`.
 */
export const STATUS_IDS = {
  requestSent: 1,
  inTriage: 3,
  pendingInformation: 4,
  mappingScheduled: 6,
  inMapping: 7,
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
