import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { evaluateScore, listCriteria } from "./prioritization.controller.ts";

const prioritizationRoutes = express.Router();

prioritizationRoutes.use(authMiddleware);

// Leitura dos critérios: perfis internos (inclui Gestor read-only)
prioritizationRoutes.get(
  "/criteria",
  requireRole("Analista", "Gestor", "Administrador"),
  listCriteria,
);
// Escrita: apenas Administrador ou Analista assignee (regra no service;
// Gestor é read-only e não pontua)
prioritizationRoutes.put(
  "/:protocol/score",
  requireRole("Analista", "Administrador"),
  evaluateScore,
);

export default prioritizationRoutes;
