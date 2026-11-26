import { z } from "zod";
import { REQUEST_PRIORITIES } from "../../shared/types/requests.ts";
import {
  QUEUE_SORT_BY,
  QUEUE_SORT_ORDER,
  type QueueFilterQuery,
  type QueueQuery,
} from "../../shared/types/queue.types.ts";

const queueFilterShape = {
  search: z.string().trim().max(254, "Máximo de 254 caracteres.").optional(),
  status: z
    .string()
    .trim()
    .min(1, "Status inválido.")
    .max(100, "Máximo de 100 caracteres.")
    .optional(),
  priority: z
    .union([z.enum(REQUEST_PRIORITIES, { error: "Prioridade inválida." }), z.literal("nenhum")])
    .optional(),
  assigneeId: z
    .union([
      z.string().trim().uuid("Identificador do responsável inválido."),
      z.string().trim().regex(/^\d+$/, "Identificador do responsável inválido."),
      z.literal("unassigned"),
    ])
    .optional(),
  unassigned: z
    .enum(["true", "false", "1", "0"], { error: 'Valor inválido para "unassigned".' })
    .transform((value) => value === "true" || value === "1")
    .optional(),
  dateFrom: z.iso.date("Data inicial inválida — use o formato AAAA-MM-DD.").optional(),
  dateTo: z.iso.date("Data final inválida — use o formato AAAA-MM-DD.").optional(),
  department: z
    .string()
    .trim()
    .min(1, "Departamento inválido.")
    .max(100, "Máximo de 100 caracteres.")
    .optional(),
};

const queueSortShape = {
  sortBy: z.enum(QUEUE_SORT_BY, { error: "Campo de ordenação inválido." }).optional(),
  sortOrder: z.enum(QUEUE_SORT_ORDER, { error: "Direção de ordenação inválida." }).optional(),
};

function hasValidDateRange(data: QueueFilterQuery): boolean {
  return !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo;
}

function hasCompatibleAssigneeFilters(data: QueueFilterQuery): boolean {
  return !(
    data.unassigned === true &&
    data.assigneeId !== undefined &&
    data.assigneeId !== "unassigned"
  );
}

/** Filtros sem paginação, compartilhados pela fila e pela exportação CSV. */
export const queueFilterQuerySchema = z
  .object(queueFilterShape, { error: "A query deve ser um objeto com filtros válidos." })
  .strict()
  .refine(hasCompatibleAssigneeFilters, {
    message: '"unassigned" e "assigneeId" não podem ser combinados.',
    path: ["unassigned"],
  })
  .refine(hasValidDateRange, {
    message: "A data inicial não pode ser posterior à data final.",
    path: ["dateFrom"],
  }) satisfies z.ZodType<QueueFilterQuery>;

/**
 * Validação da query de `GET /queue`.
 * `page`/`pageSize` são obrigatórios; os filtros compartilhados também alimentam
 * o CSV, enquanto `sortBy`/`sortOrder` valem apenas para a listagem paginada.
 */
export const queueQuerySchema = z
  .object(
    {
      ...queueFilterShape,
      ...queueSortShape,
      page: z.coerce.number().int("Deve ser um número inteiro.").min(1, "Mínimo de 1."),
      pageSize: z.coerce
        .number()
        .int("Deve ser um número inteiro.")
        .min(1, "Mínimo de 1.")
        .max(100, "Máximo de 100."),
    },
    { error: "A query deve ser um objeto com os parâmetros de paginação." },
  )
  .refine(hasCompatibleAssigneeFilters, {
    message: '"unassigned" e "assigneeId" não podem ser combinados.',
    path: ["unassigned"],
  })
  .refine(hasValidDateRange, {
    message: "A data inicial não pode ser posterior à data final.",
    path: ["dateFrom"],
  }) satisfies z.ZodType<QueueQuery>;
