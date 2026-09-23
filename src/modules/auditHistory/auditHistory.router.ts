import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  listAuditHistoryController,
  getAuditHistoryDetailController,
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
