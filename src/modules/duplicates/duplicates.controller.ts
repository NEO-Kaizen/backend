import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors } from "../../shared/validation/zodErrors.ts";
import { duplicateCheckPayloadSchema } from "./duplicates.schema.ts";
import { checkDuplicates, EMPTY_DUPLICATE_CHECK_RESPONSE } from "./duplicates.service.ts";

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

  res.set("Cache-Control", "no-store");

  try {
    return res.status(200).json(await checkDuplicates(parsed.data.demand));
  } catch (error) {
    // Falha de flag/índice/busca não impede o envio da Solicitação; a causa é
    // logada uma única vez aqui, na borda. O texto da Demanda nunca é logado.
    console.error("[duplicates] duplicate check failed", error);
    return res.status(200).json(EMPTY_DUPLICATE_CHECK_RESPONSE);
  }
}
