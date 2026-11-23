import express from "express";
import { authMiddleware } from "../../../shared/middleware/auth.ts";
import { requirePermission } from "../../../shared/middleware/requirePermission.ts";
import { getTriage, saveTriage } from "./triage.controller.ts";

const triageRoutes = express.Router();

triageRoutes.use(authMiddleware);

// Leitura e escrita por chave; a Custódia vem de
// `requests.professional_id` → `details_professional.user_id`.
triageRoutes.get("/:protocol/triage", requirePermission("triage:read"), getTriage);
triageRoutes.post("/:protocol/triage", requirePermission("triage:write"), saveTriage);

export default triageRoutes;
