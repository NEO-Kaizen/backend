import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import { centralizedQueue, getMetricsController } from "./queue.controller.ts";
import { getMappingController, putMappingController } from "./mapping.controller.ts";

const queueRoutes = express.Router();

// Fila e métricas: a chave faz o gate; o service aplica `queue:read` à
// Custódia do Responsável da solicitação ou do Mapeamento corrente.
queueRoutes.get("/metrics", authMiddleware, requirePermission("queue:read"), getMetricsController);

queueRoutes.get("/", authMiddleware, requirePermission("queue:read"), centralizedQueue);

// Subfluxo de Mapeamento (issue #86): leitura e escrita por chave; a Custódia
// (Responsável da solicitação ou do mapeamento corrente) é resolvida no service.
queueRoutes.get(
  "/requests/:protocol/mapping",
  authMiddleware,
  requirePermission("mapping:read"),
  getMappingController,
);

queueRoutes.put(
  "/requests/:protocol/mapping",
  authMiddleware,
  requirePermission("mapping:write"),
  putMappingController,
);

export default queueRoutes;
