import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { centralizedQueue, getMetricsController } from "./queue.controller.ts";

const queueRoutes = express.Router();

// Rotas internas da fila: exige sessão JWT válida e perfil interno de triagem
// (mesma restrição de `GET /requests/:protocol/internal` — issue #48).
queueRoutes.get(
  "/metrics",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  getMetricsController,
);

queueRoutes.get(
  "/",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  centralizedQueue,
);

export default queueRoutes;
