import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  streamNotifications,
} from "./notifications.controller.ts";

const notificationsRoutes = express.Router();

// Toda a plataforma de Notificações exige sessão (cookie JWT). O destinatário
// é sempre o usuário autenticado — nunca um id enviado pelo cliente.
notificationsRoutes.use(authMiddleware);

notificationsRoutes.get("/stream", streamNotifications);
notificationsRoutes.get("/unread-count", getUnreadCount);
notificationsRoutes.patch("/read-all", markAllNotificationsRead);
notificationsRoutes.get("/", listNotifications);
notificationsRoutes.patch("/:notificationId/read", markNotificationRead);

export default notificationsRoutes;
