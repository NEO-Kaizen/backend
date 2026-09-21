import express from "express";
import { authMiddleware } from "../../../shared/middleware/auth.ts";
import { requireRole } from "../../../shared/middleware/requireRole.ts";
import { getTriage, saveTriage } from "./triage.controller.ts";

const triageRoutes = express.Router();

triageRoutes.use(authMiddleware);

// Leitura: perfis internos (`Administrador`, `Gestor` read-only e `Analista`).
// O service restringe o Analista ao assignee atual da solicitação.
triageRoutes.get(
  "/:protocol/triage",
  requireRole("Analista", "Gestor", "Administrador"),
  getTriage,
);
// Escrita: `Administrador` ou o Analista assignee atual → `403` caso contrário
// (regra no service, `isAdminOrAssignee`). Gestor é read-only e não triagem.
triageRoutes.post("/:protocol/triage", requireRole("Administrador", "Analista"), saveTriage);

export default triageRoutes;
