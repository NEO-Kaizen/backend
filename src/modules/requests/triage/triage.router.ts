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
// POST inclui Gestor no gate de perfil; a regra real (só Administrador ou
// assignee atual → 403) vive no service (`isAdminOrAssignee`), espelhando o
// contrato contract-triage_04.md §0.
triageRoutes.post(
  "/:protocol/triage",
  requireRole("Analista", "Gestor", "Administrador"),
  saveTriage,
);

export default triageRoutes;
