import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  listAuditHistoryController,
  getAuditHistoryDetailController,
} from "./auditHistory.controller.ts";

const auditHistoryRoutes = express.Router();

auditHistoryRoutes.get(
  "/",
  authMiddleware,
  requireRole("Administrador"),
  listAuditHistoryController,
);

auditHistoryRoutes.get(
  "/:id",
  authMiddleware,
  requireRole("Administrador"),
  getAuditHistoryDetailController,
);

export default auditHistoryRoutes;
