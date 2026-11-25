/**
 * Ids dos status core do seed canônico.
 *
 * Fonte: `docs/rules/requests-lifecycle.md` (ids 1, 3, 4, 6, 7, 16 e 17).
 * Apenas os status core são expostos aqui: os não-core podem ser renomeados,
 * desativados ou ter `triage_mode`/`mapping_mode` alterados pelo Administrador,
 * então não servem como referência de regra de negócio. Para comportamentos
 * dependentes de não-core, use as flags da tabela `statuses`.
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
export const CORE_STATUS_IDS = Object.values(STATUS_IDS) as readonly StatusId[];
