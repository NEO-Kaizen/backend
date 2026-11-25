import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors } from "../../shared/validation/zodErrors.ts";
import { duplicateCheckPayloadSchema } from "./duplicates.schema.ts";
import { checkDuplicates } from "./duplicates.service.ts";

/**
 * `POST /requests/duplicates/check` — Alerta de duplicidade (issue #209).
 *
 * Responde `200` sempre que a consulta é válida, inclusive quando a flag está
 * desligada ou o índice falha (`confidence: "none"`, `items: []`). O texto da
 * Demanda não é ecoado, auditado nem logado.
 */
export async function postDuplicateCheck(req: Request, res: Response): Promise<Response> {
  const parsed = duplicateCheckPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const response = await checkDuplicates(parsed.data.demand);

  res.set("Cache-Control", "no-store");
  return res.status(200).json(response);
}
