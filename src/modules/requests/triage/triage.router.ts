import express from "express";
import { authMiddleware } from "../../../shared/middleware/auth.ts";
import { requireRole } from "../../../shared/middleware/requireRole.ts";
import { getTriage, saveTriage } from "./triage.controller.ts";

const triageRoutes = express.Router();

triageRoutes.use(authMiddleware);

triageRoutes.get(
  "/:protocol/triage",
  requireRole("Analista", "Gestor", "Administrador"),
  getTriage,
);
triageRoutes.post(
  "/:protocol/triage",
  requireRole("Administrador", "Analista"),
  saveTriage,
);

export default triageRoutes;
