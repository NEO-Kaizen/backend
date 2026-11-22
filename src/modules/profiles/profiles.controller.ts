import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors, formatZodIssues } from "../../shared/validation/zodErrors.ts";
import type { EffectivePermission } from "../../shared/catalog/permissionCatalog.ts";
import {
  changeProfileStatusSchema,
  createProfileSchema,
  duplicateProfileSchema,
  updateProfileSchema,
} from "./profiles.schema.ts";
import * as service from "./profiles.service.ts";

/** Ator da sessão — id do token e conjunto efetivo resolvido pelo gate de chave. */
function actorOf(req: Request): service.ProfileActor {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const userId = Number(req.user.id);

  if (!Number.isInteger(userId)) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  // Fail-closed: sem a lista do gate, nenhuma concessão passaria na escalação.
  const permissions: readonly EffectivePermission[] = req.permissions ?? [];

  return { userId, permissions };
}

export const listProfiles = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(await service.listProfiles());
};

export const getKeyCatalog = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(service.getKeyCatalog());
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(await service.getProfile(req.params.id as string));
};

export const createProfile = async (req: Request, res: Response): Promise<Response> => {
  const parsed = createProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const created = await service.createProfile(parsed.data, actorOf(req), req.ip);

  return res.status(201).json(created);
};

export const updateProfile = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const updated = await service.updateProfile(
    req.params.id as string,
    parsed.data,
    actorOf(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

export const changeProfileStatus = async (req: Request, res: Response): Promise<Response> => {
  const parsed = changeProfileStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const updated = await service.changeProfileStatus(
    req.params.id as string,
    parsed.data,
    actorOf(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

export const duplicateProfile = async (req: Request, res: Response): Promise<Response> => {
  const parsed = duplicateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const created = await service.duplicateProfile(
    req.params.id as string,
    parsed.data,
    actorOf(req),
    req.ip,
  );

  return res.status(201).json(created);
};
