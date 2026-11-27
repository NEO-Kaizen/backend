import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import {
  listAuditHistoryController,
  getAuditHistoryDetailController,
  getAuditLogsByProtocolController,
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

// Alias `GET /audit-logs/:protocol` (issue #124) — timeline da solicitação.
// `/:protocol` aqui NÃO conflita com o `/:id` numérico acima (montagens
// diferentes): `/audit-history/<int>` vs `/audit-logs/<protocol>`.
// A timeline é parte da visão interna da solicitação: a chave é `request:read`,
// não `audit:read` (a auditoria administrativa continua em `/audit-history`).
export const auditLogsRouter = express.Router();

// Mesma postura de cache da listagem administrativa: dados sensíveis não devem
// ser armazenados por navegador ou intermediários.
auditLogsRouter.use(noStore);

auditLogsRouter.get(
  "/:protocol",
  authMiddleware,
  requirePermission("request:read"),
  getAuditLogsByProtocolController,
);
