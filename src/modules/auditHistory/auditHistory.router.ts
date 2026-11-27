import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import {
  listAuditHistoryController,
  getAuditHistoryDetailController,
  getAuditLogsByProtocolController,
} from "./auditHistory.controller.ts";

const auditHistoryRoutes = express.Router();

// Dados administrativos autenticados: impede armazenamento das respostas
// pelo navegador ou por intermediários.
auditHistoryRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

auditHistoryRoutes.get(
  "/",
  authMiddleware,
  requirePermission("audit:read"),
  listAuditHistoryController,
);

auditHistoryRoutes.get(
  "/:id",
  authMiddleware,
  requirePermission("audit:read"),
  getAuditHistoryDetailController,
);

export default auditHistoryRoutes;

// Alias `GET /audit-logs/:protocol` (issue #124) — timeline de auditoria de
// uma solicitação. `/:protocol` aqui NÃO conflita com o `/:id` numérico acima
// (montagens diferentes): `/audit-history/<int>` vs `/audit-logs/<protocol>`.
export const auditLogsRouter = express.Router();

auditLogsRouter.get(
  "/:protocol",
  authMiddleware,
  requirePermission("audit:read"),
  getAuditLogsByProtocolController,
);
