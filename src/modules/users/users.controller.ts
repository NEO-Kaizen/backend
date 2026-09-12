import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import {
  changeUserStatusSchema,
  createRequesterSchema,
  listUsersQuerySchema,
} from "./users.schema.ts";
import * as service from "./users.service.ts";

function actorUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return Number(req.user.id);
}

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
  const parsed = listUsersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const users = await service.listUsers(parsed.data);

  return res.status(200).json(users);
};

export const createRequester = async (req: Request, res: Response): Promise<Response> => {
  const parsed = createRequesterSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const created = await service.createRequester(parsed.data, actorUserId(req), req.ip);

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
