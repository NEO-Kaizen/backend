import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import type { InternalRole } from "../../shared/types/internalNotes.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import {
  createInternalNoteSchema,
  markInternalNotesReadSchema,
  protocolParamsSchema,
} from "./internalNotes.schema.ts";
import * as service from "./internalNotes.service.ts";

function protocolFromRequest(req: Request): string {
  const parsed = protocolParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "params"), 400);
  }
  return parsed.data.protocol;
}

function actorFromRequest(req: Request): { userId: number; role: InternalRole } {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const userId = Number(req.user.id);
  if (!Number.isInteger(userId)) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  if (req.user.role === "Solicitante") {
    throw new AppError("Acesso restrito aos perfis internos", 403);
  }

  return { userId, role: req.user.role };
}

export const listInternalNotes = async (req: Request, res: Response): Promise<Response> => {
  const actor = actorFromRequest(req);
  const response = await service.listInternalNotes(protocolFromRequest(req), actor.userId);
  return res.status(200).json(response);
};

export const createInternalNote = async (req: Request, res: Response): Promise<Response> => {
  const parsed = createInternalNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.createInternalNote(
    protocolFromRequest(req),
    parsed.data,
    actorFromRequest(req),
  );
  return res.status(201).json(response);
};

export const markInternalNotesRead = async (req: Request, res: Response): Promise<Response> => {
  const parsed = markInternalNotesReadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const actor = actorFromRequest(req);
  await service.markInternalNotesRead(protocolFromRequest(req), parsed.data, actor.userId);
  return res.status(204).send();
};
