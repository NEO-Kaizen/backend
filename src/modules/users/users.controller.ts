import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { changeUserStatusSchema, createUserSchema, listUsersQuerySchema } from "./users.schema.ts";

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
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const created = await service.createUser(parsed.data, actorUserId(req), req.ip);

  return res.status(201).json(created);
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
