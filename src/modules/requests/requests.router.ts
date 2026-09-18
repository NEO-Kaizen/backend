import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { requireAccessMode } from "../../shared/middleware/accessMode.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
import {
  getInternalRequestByProtocol,
  getRequestsByEmail,
  getRequestsByProtocol,
  postRequest,
  getAssignees,
  patchAssignee,
} from "./requests.controller.ts";

const requestsRoutes = express.Router();

// Rotas de solicitação respeitam o modo de abertura do portal: em `PUBLIC`
// permanecem públicas; em `AUTHENTICATED` o `requireAccessMode` exige sessão.
requestsRoutes.get("/", requireAccessMode(), getRequestsByEmail);

// Responsáveis pela triagem — lista de profissionais (issue #50).
requestsRoutes.get(
  "/assignees",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  getAssignees,
);

// Apenas Administrador define/substitui o responsável (issue #50).
requestsRoutes.patch(
  "/:protocol/assignee",
  authMiddleware,
  requireRole("Administrador"),
  patchAssignee,
);

requestsRoutes.get("/:protocol", requireAccessMode(), getRequestsByProtocol);
requestsRoutes.get(
  "/:protocol/internal",
  authMiddleware,
  // Acesso à consulta administrativa restrito aos perfis internos de triagem
  // (RN — decisão P2). O perfil "Solicitante" usa a consulta pública.
  requireRole("Analista", "Gestor", "Administrador"),
  getInternalRequestByProtocol,
);
// O guard vem antes do `uploadFields` para não processar multipart de uma
// requisição que será rejeitada por falta de sessão.
requestsRoutes.post("/", requireAccessMode(), uploadFields, postRequest);

export default requestsRoutes;
