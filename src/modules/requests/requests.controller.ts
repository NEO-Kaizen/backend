import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import type { Role } from "../../shared/types/role.ts";
import { saveFiles } from "../../shared/storage/fileStorage.ts";
import { buildZodFieldErrors, formatZodIssues } from "../../shared/validation/zodErrors.ts";
import {
  assignAnalystSchema,
  assignRequestSchema,
  createRequestPayloadSchema,
  listAuthenticatedRequestsQuerySchema,
  listRequestsQuerySchema,
  updateRequestPayloadSchema,
} from "./requests.schema.ts";
import * as service from "./requests.service.ts";

/**
 * `req.user` só existe quando o `requireAccessMode`/`authMiddleware` autenticou
 * a request: sempre no modo AUTHENTICATED e, no modo PUBLIC, apenas quando veio
 * um cookie de sessão válido (identificação opcional — ver `accessMode.ts`).
 */
function authenticatedUserId(req: Request): number | undefined {
  return req.user ? Number(req.user.id) : undefined;
}

function requireAuthenticatedUserId(req: Request): number {
  const userId = authenticatedUserId(req);

  if (userId === undefined) {
    throw new AppError("Sessão inválida", 401);
  }

  return userId;
}

export const getRequestsByProtocol = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const foundRequest = await service.findRequest(protocol, authenticatedUserId(req));

  return res.status(200).json(foundRequest);
};

// Acompanhamento bimodal do solicitante (contrato `contract-pendencias_03.md`
// §3): sessão do dono → `authenticated`; identidade pública → `public`. A
// decisão de modo e o owner-check ficam no service.
export const getTracking = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const response = await service.getTracking(protocol, {
    user: req.user,
    requesterIdentity: req.requesterIdentity ?? null,
  });

  return res.status(200).json(response);
};

// Consulta administrativa/interna (issue #48) — difere de getRequestsByProtocol
// (pública, issue #34): exige autenticação e perfil interno (ver
// requests.router.ts) e retorna o DTO interno completo (RequestInternalDetailDTO).
export const getInternalRequestByProtocol = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const request = await service.findInternalByProtocol(protocol, actorFromRequest(req));

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

/** Ator autenticado (id numérico + e-mail + papel) — `req.user` vem do authMiddleware. */
function actorFromRequest(req: Request): { id: number; email: string; role: Role } {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return { id, email: req.user.email, role: req.user.role };
}

// Atualização interna dos blocos editáveis (issue #88) — modo de edição inline
// da tela `/(admin)/fila/[protocolo]`. Autenticação e perfil no router;
// autorização por atribuição (issue #121) no service.
export const patchInternalRequestByProtocol = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const parsed = updateRequestPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const updated = await service.updateInternalRequest(
    protocol,
    parsed.data,
    actorFromRequest(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

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

  const response = await service.registerRequest(
    parsed.data,
    savedAttachments,
    authenticatedUserId(req),
  );

  return res.status(201).json(response);
};

export const getRequestsByEmail = async (req: Request, res: Response): Promise<Response> => {
  // Modo autenticado: a listagem é sempre escopada à identidade da sessão.
  if (req.accessMode === "AUTHENTICATED") {
    if (req.query.email !== undefined) {
      throw new AppError("O parâmetro 'email' não é aceito no modo autenticado.", 400);
    }

    const parsed = listAuthenticatedRequestsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(formatZodIssues(parsed.error), 400);
    }

    const requests = await service.listRequestsByEmail(
      parsed.data,
      requireAuthenticatedUserId(req),
    );

    return res.status(200).json(requests);
  }

  if (req.query.email === undefined) {
    throw new AppError("Parâmetro obrigatório ausente: email", 400);
  }

  const parsed = listRequestsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  // Modo PUBLIC: a rota segue pública (fluxo anônimo por e-mail inalterado),
  // mas o solicitante logado só consulta o próprio e-mail — o service compara
  // com a identidade do cadastro e responde 403 se for de terceiro. Perfis
  // internos mantêm o comportamento atual: têm as rotas `/internal` e a fila.
  const requesterUserId = req.user?.role === "Solicitante" ? authenticatedUserId(req) : undefined;

  const requests = await service.listRequestsByEmail(parsed.data, requesterUserId, true);

  return res.status(200).json(requests);
};

export const getAssignees = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(await service.listAssignees());
};

export const patchAssignee = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const parsed = assignRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.assignResponsible(
    protocol,
    parsed.data,
    actorFromRequest(req),
    req.ip,
  );

  return res.status(200).json(response);
};

export const patchInternalAssignee = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocolParam(req);

  const parsed = assignAnalystSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.assignAnalyst(
    protocol,
    parsed.data,
    actorFromRequest(req),
    req.ip,
  );

  return res.status(200).json(response);
};
