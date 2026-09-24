import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors, formatZodIssues } from "../../shared/validation/zodErrors.ts";
import {
  changeUserStatusSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "./users.schema.ts";
import { updateProfileSchema } from "../DTOs/users/UpdateProfileRequest.dto.ts";
import * as service from "./users.service.ts";

function actorUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return id;
}

export const getUserMetrics = async (_req: Request, res: Response): Promise<Response> => {
  const metrics = await service.getUserMetrics();

  return res.status(200).json(metrics);
};

export const listAnalysts = async (_req: Request, res: Response): Promise<Response> => {
  const analysts = await service.listAnalysts();
  return res.status(200).json(analysts);
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

  const created = await service.createUser(parsed.data, actorUserId(req), req.ip);

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
    actorUserId(req),
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
    actorUserId(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

export const resetUserPassword = async (req: Request, res: Response): Promise<Response> => {
  const reset = await service.resetPassword(req.params.id as string, actorUserId(req), req.ip);

  return res.status(200).json(reset);
};

/**
 * GET /users/me — perfil completo do próprio usuário
 * (dados básicos + bloco requester + bloco professional [analista] + avatar).
 */
export const getMyProfile = async (_req: Request, res: Response): Promise<Response> => {
  const profile = await service.getMyProfile(actorUserId(_req));

  return res.status(200).json(profile);
};

/**
 * PUT /users/me — atualiza nome, contato adicional e/ou foto de perfil.
 * O próprio Administrador também pode atualizar área, departamento e gestor.
 * Self-service (actor == owner). Multipart:
 * campo `payload` (JSON) + campo `avatar` (arquivo opcional).
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<Response> => {
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

  // Mensagem explícita para perfis que tentem alterar dados administrativos.
  // O próprio Administrador é a única exceção no self-service.
  if (
    parsedPayload !== null &&
    typeof parsedPayload === "object" &&
    "requester" in (parsedPayload as Record<string, unknown>)
  ) {
    const rawReq = (parsedPayload as Record<string, unknown>).requester as Record<
      string,
      unknown
    > | null;
    if (
      req.user?.role !== "Administrador" &&
      rawReq !== null &&
      typeof rawReq === "object" &&
      ("area" in rawReq || "department" in rawReq || "manager" in rawReq)
    ) {
      throw new AppError(
        "Área, departamento e gestor só podem ser alterados por administrador. Use PUT /users/:id.",
        403,
      );
    }
  }

  const parsed = updateProfileSchema.safeParse(parsedPayload);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const updated = await service.updateMyProfile(
    actorUserId(req),
    actorUserId(req),
    parsed.data,
    req.file,
  );

  return res.status(200).json(updated);
};
