import { z } from "zod";
import { optionalString } from "../../shared/validation/fieldSchemas.ts";

/** Nota inteira de 1 a 5 (RN-007 / issue-51). */
const noteSchema = z
  .number()
  .int("Deve ser um número inteiro.")
  .min(1, "Mínimo de 1.")
  .max(5, "Máximo de 5.");

export const evaluateScoreSchema = z.object({
  notes: z
    .record(z.string(), noteSchema)
    .refine((notes) => Object.keys(notes).length > 0, {
      message: "Informe ao menos uma nota.",
      path: ["notes"],
    }),
  justification: optionalString(500),
});