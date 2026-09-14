import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { saveFiles } from "../../shared/storage/fileStorage.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { createRequestPayloadSchema, listRequestsQuerySchema } from "./requests.schema.ts";
import * as service from "./requests.service.ts";

export const getRequestsByProtocol = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const foundRequest = await service.findRequest(protocol);

  return res.status(200).json(foundRequest);
};

// Consulta administrativa/interna (issue #48) — difere de getRequestsByProtocol
// (pública, issue #34): exige autenticação e perfil interno (ver
// requests.router.ts) e retorna o DTO interno completo (RequestInternalDetailDTO).
export const getInternalRequestByProtocol = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const request = await service.findInternalByProtocol(protocol);

  return res.status(200).json(request);
};

/** Valida e devolve `req.params.protocol` — comum aos dois handlers da rota. */
function assertProtocolParam(req: Request): string {
  const protocol = req.params.protocol as string;

  if (!protocol || typeof protocol !== "string" || protocol.trim() === "") {
    throw new AppError("Protocolo é obrigatório", 400);
  }

  return protocol.trim();
}

export const postRequest = async (req: Request, res: Response): Promise<Response> => {
  const payloadPart: unknown = req.body?.payload;

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

  const response = await service.registerRequest(parsed.data, savedAttachments);

  return res.status(201).json(response);
};

export const getRequestsByEmail = async (req: Request, res: Response): Promise<Response> => {
  if (req.query.email === undefined) {
    throw new AppError("Parâmetro obrigatório ausente: email", 400);
  }

  const parsed = listRequestsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const requests = await service.listRequestsByEmail(parsed.data);

  return res.status(200).json(requests);
};
