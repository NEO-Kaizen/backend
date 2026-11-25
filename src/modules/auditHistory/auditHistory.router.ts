import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  listAuditHistoryController,
  getAuditHistoryDetailController,
  getAuditLogsByProtocolController,
  getStatusTimesByProtocolController,
} from "./auditHistory.controller.ts";

const noStore = (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
};

const auditHistoryRoutes = express.Router();

// Dados administrativos autenticados: impede armazenamento das respostas
// pelo navegador ou por intermediários.
auditHistoryRoutes.use(noStore);

auditHistoryRoutes.get(
  "/",
  authMiddleware,
  requireRole("Administrador", "Gestor"),
  listAuditHistoryController,
);

auditHistoryRoutes.get(
  "/:id",
  authMiddleware,
  requireRole("Administrador", "Gestor"),
  getAuditHistoryDetailController,
);

export default auditHistoryRoutes;

// Alias `GET /audit-logs/:protocol` (issue #124) — timeline de auditoria de
// uma solicitação. `/:protocol` aqui NÃO conflita com o `/:id` numérico acima
// (montagens diferentes): `/audit-history/<int>` vs `/audit-logs/<protocol>`.
export const auditLogsRouter = express.Router();

// Mesma postura de cache da listagem administrativa: dados sensíveis não devem
// ser armazenados por navegador ou intermediários.
auditLogsRouter.use(noStore);

auditLogsRouter.get(
  "/:protocol/status-times",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  getStatusTimesByProtocolController,
);

auditLogsRouter.get(
  "/:protocol",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  getAuditLogsByProtocolController,
);
