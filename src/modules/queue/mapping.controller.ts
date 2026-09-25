// Handlers HTTP do subfluxo de Mapeamento (`/queue/requests/:protocol/mapping`).
// Enxutos: validam a forma do request e delegam as regras ao service.
import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors } from "../../shared/validation/zodErrors.ts";
import type { MappingActor } from "../DTOs/queue/mapping.dto.ts";
import { mappingPayloadSchema } from "./mapping.schemas.ts";
import { getMappingService, upsertMappingService } from "./mapping.service.ts";

/** Valida e devolve `req.params.protocol` — mesmo padrão do módulo `requests`. */
function assertProtocolParam(req: Request): string {
  const protocol = req.params.protocol as string;

  if (!protocol || typeof protocol !== "string" || protocol.trim() === "") {
    throw new AppError("Protocolo é obrigatório", 400);
  }

  return protocol.trim();
}

/** Ator autenticado (id numérico + e-mail + perfil) — `req.user` vem do authMiddleware. */
function actorFromRequest(req: Request): MappingActor {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  return { id, email: req.user.email, role: req.user.role };
}

export const getMappingController = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  return res.status(200).json(await getMappingService(protocol));
};

export const putMappingController = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  // Ator validado ANTES do parse do payload: sessão inválida/expirada responde
  // 401 mesmo com body malformado (precedência de autenticação sobre validação).
  const actor = actorFromRequest(req);

  const body: unknown = req.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new AppError("O payload deve ser um objeto JSON.", 400);
  }

  const parsed = mappingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const response = await upsertMappingService(protocol, parsed.data, actor, req.ip);

  return res.status(200).json(response);
};
