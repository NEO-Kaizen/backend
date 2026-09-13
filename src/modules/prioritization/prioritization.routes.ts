import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { evaluateScore, listCriteria } from "./prioritization.controller.ts";

const prioritizationRoutes = express.Router();

prioritizationRoutes.use(authMiddleware);
prioritizationRoutes.use(requireRole("Analista", "Gestor"));

prioritizationRoutes.get("/criteria", listCriteria);
prioritizationRoutes.put("/:protocol/score", evaluateScore);

export default prioritizationRoutes;