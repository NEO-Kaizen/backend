import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors } from "../../shared/validation/zodErrors.ts";
import { permissionActorFromRequest } from "../../shared/access/requestAccess.ts";
import {
  changeProfileStatusSchema,
  createProfileSchema,
  duplicateProfileSchema,
  profileIdParamSchema,
  updateProfileSchema,
} from "./profiles.schema.ts";
import * as service from "./profiles.service.ts";

/** `:id` validado na borda — malformado é tratado como perfil inexistente (anti-enumeração). */
function idParam(req: Request): string {
  const parsed = profileIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    throw new AppError("Perfil não encontrado", 404);
  }

  return parsed.data.id;
}

/**
 * Ator da sessão — id do token e conjunto efetivo resolvido pelo gate de chave.
 * Reutiliza o helper compartilhado: sem a lista de Permissões carregada, a
 * operação é recusada (403) em vez de seguir com um conjunto vazio.
 */
function requireProfileActor(req: Request): service.ProfileActor {
  const actor = permissionActorFromRequest(req);

  return { userId: actor.id, permissions: actor.permissions };
}

export const listProfiles = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(await service.listProfiles());
};

export const getKeyCatalog = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(service.getKeyCatalog());
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json(await service.getProfile(idParam(req)));
};

export const createProfile = async (req: Request, res: Response): Promise<Response> => {
  const parsed = createProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const created = await service.createProfile(parsed.data, requireProfileActor(req), req.ip);

  return res.status(201).json(created);
};

export const updateProfile = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const updated = await service.updateProfile(
    idParam(req),
    parsed.data,
    requireProfileActor(req),
    req.ip,
  );

  return res.status(200).json(updated);
};

export const changeProfileStatus = async (req: Request, res: Response): Promise<Response> => {
  const parsed = changeProfileStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const updated = await service.changeProfileStatus(
    idParam(req),
    parsed.data,
    requireProfileActor(req),
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
    idParam(req),
    parsed.data,
    requireProfileActor(req),
    req.ip,
  );

  return res.status(201).json(created);
};
