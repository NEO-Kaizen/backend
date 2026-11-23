import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { requesterDualAuth } from "../../shared/middleware/dualAuth.ts";
import {
  exportQueueCsvController,
  getDashboardController,
  getRequesterRequestPdfController,
} from "./reports.controller.ts";
const reportsRoutes = express.Router();

reportsRoutes.get(
  "/request/protocol/:protocol/pdf",
  requesterDualAuth,
  getRequesterRequestPdfController,
);

reportsRoutes.get(
  "/dashboard",
  authMiddleware,
  requireRole("Gestor", "Administrador"),
  getDashboardController,
);

reportsRoutes.get(
  "/requests.csv",
  authMiddleware,
  requireRole("Gestor", "Administrador"),
  exportQueueCsvController,
);

export default reportsRoutes;
