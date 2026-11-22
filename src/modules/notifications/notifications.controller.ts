import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import type { NotificationItem } from "../DTOs/notifications/Notifications.dto.ts";
import {
  onNotificationCommitted,
  type NotificationCommittedPayload,
} from "../../shared/notifications/notificationEmitter.ts";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  notificationIdSchema,
} from "./notifications.schema.ts";
import * as service from "./notifications.service.ts";

const HEARTBEAT_INTERVAL_MS = 25_000;
const SSE_RETRY_MS = 3_000;

function requireUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const userId = Number(req.user.id);

  if (!Number.isInteger(userId)) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  return userId;
}

export async function listNotifications(req: Request, res: Response): Promise<Response> {
  const parsed = listNotificationsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const result = await service.listNotifications(requireUserId(req), parsed.data);
  return res.status(200).json(result);
}

export async function getUnreadCount(req: Request, res: Response): Promise<Response> {
  const result = await service.getUnreadCount(requireUserId(req));
  return res.status(200).json(result);
}

export async function markNotificationRead(req: Request, res: Response): Promise<Response> {
  const parsed = notificationIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const result = await service.markNotificationRead(requireUserId(req), parsed.data.notificationId);
  return res.status(200).json(result);
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<Response> {
  const result = await service.markAllNotificationsRead(requireUserId(req));
  return res.status(200).json(result);
}

function readLastEventId(req: Request): string | null {
  const header = req.headers["last-event-id"];
  const raw = Array.isArray(header) ? header[0] : (header ?? req.query.lastEventId);

  if (typeof raw !== "string") return null;

  return notificationIdSchema.safeParse(raw).success ? raw : null;
}

/**
 * `GET /notifications/stream` — SSE autenticado por cookie de sessão.
 *
 * O banco é a fonte de verdade. Ao reconectar com `Last-Event-ID`, o handler
 * reenvia as Notificações criadas depois da âncora; o cliente também
 * deduplica por `id`. Eventos ao vivo são enfileirados durante o replay para
 * não se perderem entre a consulta e a assinatura.
 */
export async function streamNotifications(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(`retry: ${SSE_RETRY_MS}\n: connected\n\n`);

  const sentIds = new Set<string>();

  const writeNotification = (item: NotificationItem): void => {
    if (sentIds.has(item.id) || res.writableEnded) return;

    sentIds.add(item.id);
    res.write(`id: ${item.id}\nevent: notification\ndata: ${JSON.stringify(item)}\n\n`);
  };

  const deliver = async (notificationIds: readonly string[]): Promise<void> => {
    const items = await service.findNotificationsByIds(userId, notificationIds);
    for (const item of items) {
      writeNotification(item);
    }
  };

  let isReplaying = true;
  let isClosed = false;
  const queued: NotificationCommittedPayload[] = [];

  const unsubscribe = onNotificationCommitted((payload) => {
    if (payload.userId !== userId) return;

    if (isReplaying) {
      queued.push(payload);
      return;
    }

    void deliver(payload.notificationIds).catch((error: unknown) => {
      console.error("[notifications] falha ao entregar notificações via SSE", error);
      cleanup();
    });
  });

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": keep-alive\n\n");
    }
  }, HEARTBEAT_INTERVAL_MS);

  function cleanup(): void {
    if (isClosed) return;

    isClosed = true;
    clearInterval(heartbeat);
    unsubscribe();

    if (!res.writableEnded) {
      res.end();
    }
  }

  req.on("close", cleanup);
  res.on("close", cleanup);

  try {
    const lastEventId = readLastEventId(req);

    if (lastEventId) {
      const missed = await service.findNotificationsAfter(userId, lastEventId);
      for (const item of missed) {
        writeNotification(item);
      }
    }

    isReplaying = false;

    for (const payload of queued) {
      await deliver(payload.notificationIds);
    }
  } catch (error) {
    console.error("[notifications] falha no replay de notificações", error);
    cleanup();
  }
}
