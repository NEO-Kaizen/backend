import { z } from "zod";
import { isOrderedDateRange } from "../../shared/datetime/businessDay.ts";
import { REQUEST_PRIORITIES } from "../../shared/types/requests.ts";
import {
  QUEUE_SORT_BY,
  QUEUE_SORT_ORDER,
  type QueueExportQuery,
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
  createdFrom: z.iso.date("Data inicial inválida — use o formato AAAA-MM-DD.").optional(),
  createdTo: z.iso.date("Data final inválida — use o formato AAAA-MM-DD.").optional(),
  department: z
    .string()
    .trim()
    .min(1, "Departamento inválido.")
    .max(200, "Máximo de 200 caracteres.")
    .optional(),
};

const queueSortShape = {
  sortBy: z.enum(QUEUE_SORT_BY, { error: "Campo de ordenação inválido." }).optional(),
  sortOrder: z.enum(QUEUE_SORT_ORDER, { error: "Direção de ordenação inválida." }).optional(),
};

function hasCompatibleAssigneeFilters(filters: QueueFilterQuery): boolean {
  return !(
    filters.unassigned === true &&
    filters.assigneeId !== undefined &&
    filters.assigneeId !== "unassigned"
  );
}

/** Regras aplicáveis tanto à fila paginada quanto à exportação CSV. */
function applyQueueRefinements<Output extends QueueFilterQuery, Input>(
  schema: z.ZodType<Output, Input>,
) {
  return schema
    .refine(hasCompatibleAssigneeFilters, {
      message: '"unassigned" e "assigneeId" não podem ser combinados.',
      path: ["unassigned"],
    })
    .refine((filters) => isOrderedDateRange({ from: filters.createdFrom, to: filters.createdTo }), {
      message: "A data inicial não pode ser posterior à data final.",
      path: ["createdFrom"],
    });
}

/**
 * Filtros e ordenação da exportação CSV (sem paginação).
 * A exportação aceita `sortBy`/`sortOrder` conforme o contrato RF04.
 */
export const queueFilterQuerySchema = applyQueueRefinements(
  z
    .object(
      {
        ...queueFilterShape,
        ...queueSortShape,
      },
      { error: "A query deve ser um objeto com filtros válidos." },
    )
    .strict(),
) satisfies z.ZodType<QueueExportQuery>;

/**
 * Validação da query de `GET /queue`.
 * `page`/`pageSize` são obrigatórios; os demais parâmetros seguem o mesmo
 * contrato da exportação e também alimentam a listagem paginada.
 */
export const queueQuerySchema = applyQueueRefinements(
  z.object(
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
  ),
) satisfies z.ZodType<QueueQuery>;
