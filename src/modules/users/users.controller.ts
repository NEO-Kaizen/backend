import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { permissionActorFromRequest } from "../../shared/access/requestAccess.ts";
import { buildZodFieldErrors, formatZodIssues } from "../../shared/validation/zodErrors.ts";
import {
  changeUserStatusSchema,
  createUserSchema,
  listAssignableProfessionalsQuerySchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "./users.schema.ts";
import { updateProfileSchema } from "../DTOs/users/UpdateProfileRequest.dto.ts";
import * as service from "./users.service.ts";
import type { AccountActor } from "./users.service.ts";

/** Id do ator autenticado, vindo de `req.user` (o gate já validou a sessão). */
function actorIdFromRequest(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return id;
}

/** Ator da matriz de contas — `req.permissions` é populado pelo gate de chave. */
function actorFromRequest(req: Request): AccountActor {
  return permissionActorFromRequest(req);
}

/** Ator do autoatendimento — as Permissões vêm do próprio módulo, sem gate. */
async function selfActorFromRequest(req: Request): Promise<AccountActor> {
  const id = actorIdFromRequest(req);
  const permissions = await service.loadActorPermissions(id);
  return { id, permissions };
}

export const getUserMetrics = async (_req: Request, res: Response): Promise<Response> => {
  const metrics = await service.getUserMetrics();

  return res.status(200).json(metrics);
};

export const listAssignableProfessionals = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const parsed = listAssignableProfessionalsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const professionals = await service.listAssignableProfessionals(
    parsed.data.stage,
    parsed.data.protocol,
  );
  return res.status(200).json(professionals);
};

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
  const parsed = listUsersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const users = await service.listUsers(parsed.data);

  return res.status(200).json(users);
};

export const createUser = async (req: Request, res: Response): Promise<Response> => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const created = await service.createUser(parsed.data, actorFromRequest(req), req.ip);

  return res.status(201).json(created);
};

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const updated = await service.updateUser(
    req.params.id as string,
    parsed.data,
    actorFromRequest(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

export const getUser = async (req: Request, res: Response): Promise<Response> => {
  const user = await service.getUser(req.params.id as string);

  return res.status(200).json(user);
};

export const changeUserStatus = async (req: Request, res: Response): Promise<Response> => {
  const parsed = changeUserStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const updated = await service.changeUserStatus(
    req.params.id as string,
    parsed.data,
    actorFromRequest(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

export const resetUserPassword = async (req: Request, res: Response): Promise<Response> => {
  const reset = await service.resetPassword(req.params.id as string, actorFromRequest(req), req.ip);

  return res.status(200).json(reset);
};

/**
 * GET /users/me — perfil completo do próprio usuário
 * (dados básicos + bloco requester + bloco professional [Perfil atribuível] + avatar).
 */
export const getMyProfile = async (req: Request, res: Response): Promise<Response> => {
  const profile = await service.getMyProfile(actorIdFromRequest(req));

  return res.status(200).json(profile);
};

/**
 * PUT /users/me — atualiza nome, contato adicional e/ou foto de perfil.
 * Quem tem `user:manage` também pode atualizar área, departamento e gestor.
 * Self-service (actor == owner). Multipart:
 * campo `payload` (JSON) + campo `avatar` (arquivo opcional).
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<Response> => {
  const actor = await selfActorFromRequest(req);

  const payloadPart: unknown = req.body?.payload;

  if (typeof payloadPart !== "string" || payloadPart.trim() === "") {
    throw new AppError("Parte 'payload' ausente no corpo da requisição.", 400);
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(payloadPart);
  } catch {
    throw new AppError("A parte 'payload' contém um JSON inválido.", 400);
  }

  const parsed = updateProfileSchema.safeParse(parsedPayload);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  // A regra de área/departamento/gestor (`user:manage`) é aplicada no service.
  const updated = await service.updateMyProfile(actor, parsed.data, req.file);

  return res.status(200).json(updated);
};
