import { z } from "zod";
import { optionalString } from "../../shared/validation/fieldSchemas.ts";

/** Nota inteira de 1 a 5 (RN-007 / issue-51). */
const noteSchema = z
  .number()
  .int("Deve ser um número inteiro.")
  .min(1, "Mínimo de 1.")
  .max(5, "Máximo de 5.");

/** Chave de critério — igual ao tamanho de `criterion_id varchar(50)`. */
const criterionKeySchema = z
  .string()
  .trim()
  .max(50, "Identificador de critério inválido (máx. 50).");

/**
 * Corpo de `PUT /prioritization/:protocol/score`.
 *
 * D-O3 (resolvida — decisão A): chaves extras no body (ex.: `pesos`) são
 * removidas silenciosamente pelo zod (*strip*) e nunca chegam ao serviço; o
 * peso vem exclusivamente de `criteria.weight`. Documentado no contrato.
 */
export const evaluateScoreSchema = z.object({
  notes: z.record(criterionKeySchema, noteSchema).refine((notes) => Object.keys(notes).length > 0, {
    message: "Informe ao menos uma nota.",
    path: ["notes"],
  }),
  justification: optionalString(500),
});
