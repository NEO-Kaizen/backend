import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
import {
  getInternalRequestByProtocol,
  getRequestsByEmail,
  getRequestsByProtocol,
  postRequest,
  getAssignees,
  patchAssignee,
  patchInternalRequestByProtocol,
} from "./requests.controller.ts";

const requestsRoutes = express.Router();

requestsRoutes.get("/", getRequestsByEmail);
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

requestsRoutes.get("/:protocol", getRequestsByProtocol);
requestsRoutes.get(
  "/:protocol/internal",
  authMiddleware,
  // Acesso à consulta administrativa restrito aos perfis internos de triagem
  // (RN — decisão P2). O perfil "Solicitante" usa a consulta pública.
  requireRole("Analista", "Gestor", "Administrador"),
  getInternalRequestByProtocol,
);
// Atualização interna dos blocos editáveis (issue #88). Perfis internos passam
// pelo requireRole; a autorização por atribuição (issue #121) acontece no
// service: Administrador/Gestor editam qualquer; Analista só as próprias.
requestsRoutes.patch(
  "/:protocol/internal",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  patchInternalRequestByProtocol,
);
requestsRoutes.post("/", uploadFields, postRequest);

export default requestsRoutes;
