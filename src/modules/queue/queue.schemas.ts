import { z } from "zod";
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from "../../shared/types/requests.ts";
import type { QueueFilterQuery, QueueQuery } from "../../shared/types/queue.types.ts";

const queueFilterShape = {
  search: z.string().trim().max(254, "Máximo de 254 caracteres.").optional(),
  status: z.enum(REQUEST_STATUSES, { error: "Status inválido." }).optional(),
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
};

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
  }) satisfies z.ZodType<QueueFilterQuery>;

/**
 * Validação da query de `GET /queue`.
 * `page`/`pageSize` são obrigatórios; os demais campos também alimentam o CSV.
 */
export const queueQuerySchema = z
  .object(
    {
      ...queueFilterShape,
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
  }) satisfies z.ZodType<QueueQuery>;
