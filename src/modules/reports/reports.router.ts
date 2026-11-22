import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  exportQueueCsvController,
  getDashboardController,
  getReportPdfController,
  getRequesterRequestPdfController,
} from "./reports.controller.ts";
const reportsRoutes = express.Router();

reportsRoutes.get(
  "/request/:request_id/pdf",
  authMiddleware,
  requireRole("Gestor", "Administrador"),
  getReportPdfController,
);

reportsRoutes.get(
  "/request/protocol/:protocol/pdf",
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
