import express from "express";
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
  // @ts-ignore
  authMiddleware,
  // @ts-ignore
  requireRole("Gestor", "Administrador"),
  getDashboardController,
);

reportsRoutes.get(
  "/requests.csv",
  // @ts-ignore
  authMiddleware,
  // @ts-ignore
  requireRole("Gestor", "Administrador"),
  exportQueueCsvController,
);

export default reportsRoutes;
