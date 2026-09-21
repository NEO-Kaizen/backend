import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { createPendingItemsSchema, reviewSchema, verifySchema } from "./pendingItems.schema.ts";
import * as service from "./pendingItems.service.ts";
import { createRateLimiter } from "../../shared/middleware/rateLimit.ts";

const { checkRateLimit } = createRateLimiter({ windowMs: 10 * 60 * 1000, limit: 10 });

function rateLimitKey(ip: string | undefined, protocol: string): string {
  return `${ip ?? "unknown"}:${protocol.trim().toLowerCase()}`;
}

function callerFromRequest(req: Request): {
  user?: typeof req.user;
  requesterIdentity?: { name: string; email: string } | null;
} {
  return { user: req.user, requesterIdentity: req.requesterIdentity ?? null };
}

function assertProtocol(req: Request): string {
  const p = req.params.protocol as string;
  if (!p || typeof p !== "string" || p.trim() === "")
    throw new AppError("Protocolo é obrigatório", 400);
  return p.trim();
}

function actorFromRequest(req: Request): { id: number; email: string; role: string } {
  if (!req.user) throw new AppError("Token inválido ou expirado", 401);
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) throw new AppError("Token inválido ou expirado", 401);
  return { id, email: req.user.email, role: req.user.role };
}

export async function createPendingItems(req: Request, res: Response): Promise<Response> {
  const protocol = assertProtocol(req);
  const parsed = createPendingItemsSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(formatZodIssues(parsed.error), 400);
  const result = await service.createPendingItems(
    protocol,
    parsed.data as never,
    actorFromRequest(req),
    req.ip,
  );
  return res.status(201).json(result);
}

export async function listPendingItems(req: Request, res: Response): Promise<Response> {
  const protocol = assertProtocol(req);
  const items = await service.listPendingItems(protocol, callerFromRequest(req));
  return res.status(200).json(items);
}

export async function respondPendingItem(req: Request, res: Response): Promise<Response> {
  const protocol = assertProtocol(req);
  const pendingItemId = req.params.pendingItemId as string;
  if (!pendingItemId || pendingItemId.trim() === "")
    throw new AppError("pendingItemId é obrigatório", 400);
  const isInternal = !!req.user;
  const actorEmail = req.user?.email;
  const item = await service.respondPendingItem(
    protocol,
    pendingItemId.trim(),
    req.body as Record<string, unknown>,
    actorEmail,
    isInternal,
    req.ip,
    callerFromRequest(req),
  );
  return res.status(200).json(item);
}

export async function attachPendingItem(req: Request, res: Response): Promise<Response> {
  const protocol = assertProtocol(req);
  const pendingItemId = req.params.pendingItemId as string;
  if (!pendingItemId || pendingItemId.trim() === "")
    throw new AppError("pendingItemId é obrigatório", 400);
  const file = (req as unknown as { file?: Express.Multer.File }).file;
  if (!file) throw new AppError("Campos obrigatórios ausentes: file", 400);
  const result = await service.addAttachment(
    protocol,
    pendingItemId.trim(),
    file,
    req.ip,
    callerFromRequest(req),
  );
  return res.status(201).json(result);
}

export async function reviewPendingItems(req: Request, res: Response): Promise<Response> {
  const protocol = assertProtocol(req);
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(formatZodIssues(parsed.error), 400);
  const result = await service.reviewPendingItems(
    protocol,
    parsed.data as never,
    actorFromRequest(req),
    req.ip,
  );
  return res.status(200).json(result);
}

export async function publicVerify(req: Request, res: Response): Promise<Response> {
  const protocol = assertProtocol(req);
  const body = {
    ...(req.body as object),
    protocol: (req.body as Record<string, unknown>)?.["protocol"] ?? protocol,
  };
  // ordem contrato 03 §7: rate-limit → formato → modo → identidade (todas as tentativas contam)
  const key = rateLimitKey(req.ip, protocol);
  if (!checkRateLimit(key))
    throw new AppError("Muitas tentativas. Tente novamente em alguns minutos.", 429);

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) throw new AppError(formatZodIssues(parsed.error), 400);

  await service.verifyPublicAccess(
    protocol,
    parsed.data.name,
    parsed.data.email,
    parsed.data.protocol,
  );

  return res.status(200).json({ protocol, canAccess: true });
}
