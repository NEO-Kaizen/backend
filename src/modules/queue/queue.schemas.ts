import { z } from "zod";
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from "../../shared/types/requests.ts";
import type { QueueQuery } from "../../shared/types/queue.types.ts";

/**
 * Validação da query de `GET /queue` (via Zod, mesmo padrão dos demais módulos).
 *
 * Contrato:
 * - `page`/`pageSize` são obrigatórios e inteiros (`page >= 1`, `1 <= pageSize <= 100`);
 * - `unassigned` aceita apenas `true`/`false`/`1`/`0` (qualquer outro valor => 400);
 * - `assigneeId` aceita UUID ou o literal `unassigned` — valores numéricos são
 *   rejeitados porque `professional_id` é UUID (tabela details_professional);
 * - `unassigned=true` é incompatível com `assigneeId=<uuid>` (combinação => 400).
 */
export const queueQuerySchema = z
  .object(
    {
      search: z.string().trim().max(254, "Máximo de 254 caracteres.").optional(),
      status: z.enum(REQUEST_STATUSES, { error: "Status inválido." }).optional(),
      priority: z.enum(REQUEST_PRIORITIES, { error: "Prioridade inválida." }).optional(),
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
      page: z.coerce.number().int("Deve ser um número inteiro.").min(1, "Mínimo de 1."),
      pageSize: z.coerce
        .number()
        .int("Deve ser um número inteiro.")
        .min(1, "Mínimo de 1.")
        .max(100, "Máximo de 100."),
    },
    {
      error: "A query deve ser um objeto com os parâmetros de paginação.",
    },
  )
  .refine(
    (data) =>
      !(
        data.unassigned === true &&
        data.assigneeId !== undefined &&
        data.assigneeId !== "unassigned"
      ),
    { message: '"unassigned" e "assigneeId" não podem ser combinados.', path: ["unassigned"] },
  ) satisfies z.ZodType<QueueQuery>;
