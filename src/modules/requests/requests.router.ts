import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
import {
  getInternalRequestByProtocol,
  getRequestsByEmail,
  getRequestsByProtocol,
  postRequest,
} from "./requests.controller.ts";

const requestsRoutes = express.Router();

requestsRoutes.get("/", getRequestsByEmail);
requestsRoutes.get("/:protocol", getRequestsByProtocol);
requestsRoutes.get(
  "/:protocol/internal",
  authMiddleware,
  // Acesso à consulta administrativa restrito aos perfis internos de triagem
  // (RN — decisão P2). O perfil "Solicitante" usa a consulta pública.
  requireRole("Analista", "Gestor", "Administrador"),
  getInternalRequestByProtocol,
);
requestsRoutes.post("/", uploadFields, postRequest);

export default requestsRoutes;
