import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import { exportQueueCsvController, getDashboardController } from "./reports.controller.ts";

const reportsRoutes = express.Router();

// Dashboard consolidado: chave global `reports:read`.
reportsRoutes.get(
  "/dashboard",
  authMiddleware,
  requirePermission("reports:read"),
  getDashboardController,
);

// Exportação da Fila: `queue:export` com a Custódia da Fila (Responsável da
// solicitação); a chave é negada ao Analista pela matriz base.
reportsRoutes.get(
  "/requests.csv",
  authMiddleware,
  requirePermission("queue:export"),
  exportQueueCsvController,
);

export default reportsRoutes;
