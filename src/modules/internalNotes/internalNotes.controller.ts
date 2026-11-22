import type { Request, Response } from "express";
import { permissionActorFromRequest } from "../../shared/access/requestAccess.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import {
  createInternalNoteSchema,
  listTimelineQuerySchema,
  markInternalNotesReadSchema,
  protocolParamsSchema,
} from "./internalNotes.schema.ts";
import * as service from "./internalNotes.service.ts";
import type { InternalNotesActor } from "./internalNotes.service.ts";

function protocolFromRequest(req: Request): string {
  const parsed = protocolParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "params"), 400);
  }
  return parsed.data.protocol;
}

function actorFromRequest(req: Request): InternalNotesActor {
  const actor = permissionActorFromRequest(req);
  const role = req.user?.role;

  if (!role) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  return { ...actor, role };
}

export const listInternalNotes = async (req: Request, res: Response): Promise<Response> => {
  const parsed = listTimelineQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  const response = await service.listInternalNotes(
    protocolFromRequest(req),
    actorFromRequest(req),
    parsed.data,
    req.ip,
  );
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
    req.ip,
  );
  return res.status(201).json(response);
};

export const markInternalNotesRead = async (req: Request, res: Response): Promise<Response> => {
  const parsed = markInternalNotesReadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  await service.markInternalNotesRead(
    protocolFromRequest(req),
    parsed.data,
    actorFromRequest(req),
    req.ip,
  );
  return res.status(204).send();
};
