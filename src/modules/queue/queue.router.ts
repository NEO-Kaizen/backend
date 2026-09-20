import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { centralizedQueue, getMetricsController } from "./queue.controller.ts";
import { getMappingController, putMappingController } from "./mapping.controller.ts";

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

// Subfluxo de Mapeamento (issue #86) — no fluxo da fila, sob o mesmo guard de
// perfis internos. A autorização de EDIÇÃO (responsável ou Administrador) é
// validada no service (o GET é de leitura para todos os perfis internos).
queueRoutes.get(
  "/requests/:protocol/mapping",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  getMappingController,
);

queueRoutes.put(
  "/requests/:protocol/mapping",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  putMappingController,
);

export default queueRoutes;
