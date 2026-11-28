import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import {
  requireAnyPermission,
  requirePermission,
} from "../../shared/middleware/requirePermission.ts";
import { evaluateScore, listCriteria } from "./prioritization.controller.ts";

const prioritizationRoutes = express.Router();

prioritizationRoutes.use(authMiddleware);

// Critérios: o avaliador (`prioritization:write`) lê os critérios como parte
// do cálculo; quem só configura usa `prioritization_config:read`.
prioritizationRoutes.get(
  "/criteria",
  requireAnyPermission(["prioritization:write", "prioritization_config:read"]),
  listCriteria,
);
// Avaliação: chave custodial; a Custódia da solicitação é aplicada no service.
prioritizationRoutes.put(
  "/:protocol/score",
  requirePermission("prioritization:write"),
  evaluateScore,
);

export default prioritizationRoutes;
