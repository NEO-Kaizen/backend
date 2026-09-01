import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { saveFiles } from "../../shared/storage/fileStorage.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { createRequestPayloadSchema } from "./requests.schema.ts";
import { registerRequest } from "./requests.service.ts";

export const postRequest = async (req: Request, res: Response): Promise<Response> => {
  const payloadPart: unknown = req.body.payload;

  if (typeof payloadPart !== "string" || payloadPart.trim() === "") {
    throw new AppError("Parte 'payload' ausente no corpo da requisição.", 400);
  }

  let request: unknown;
  try {
    request = JSON.parse(payloadPart);
  } catch {
    throw new AppError("A parte 'payload' contém um JSON inválido.", 400);
  }

  const parsed = createRequestPayloadSchema.safeParse(request);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }
  const multerFiles = req.files;
  const attachments =
    multerFiles && !Array.isArray(multerFiles) ? (multerFiles.attachments ?? []) : [];
  const savedAttachments = await saveFiles(attachments);

  const response = await registerRequest(parsed.data, savedAttachments);

  return res.status(201).json(response);
};
