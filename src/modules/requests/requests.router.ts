import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import { requireAccessMode } from "../../shared/middleware/accessMode.ts";
import { requesterDualAuth } from "../../shared/middleware/dualAuth.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
import {
  getInternalRequestByProtocol,
  getRequestsByEmail,
  getRequestsByProtocol,
  getTracking,
  patchInternalAssignee,
  patchRequestStatus,
  postRequest,
  getAssignees,
  patchAssignee,
  patchInternalRequestByProtocol,
} from "./requests.controller.ts";

const requestsRoutes = express.Router();

// Rotas de solicitação respeitam o modo de abertura do portal: em `PUBLIC`
// permanecem públicas; em `AUTHENTICATED` o `requireAccessMode` exige sessão.
requestsRoutes.get("/", requireAccessMode(), getRequestsByEmail);

// Responsáveis pela triagem — lista de profissionais (issue #50).
requestsRoutes.get(
  "/assignees",
  authMiddleware,
  requirePermission("assignee_directory:read"),
  getAssignees,
);

// Contrato contract-assign-action.md: PATCH /requests/:protocol/internal/assignee com body {assigneeId} | {mappingAssigneeId} (user_id string, XOR, null para remover)
// A chave request:assign faz o gate da operação; o service valida Custódia
// da solicitação e a Atribuibilidade do alvo. Mantida rota legada /:protocol/assignee.
requestsRoutes.patch(
  "/:protocol/internal/assignee",
  authMiddleware,
  requirePermission("request:assign"),
  patchInternalAssignee,
);

requestsRoutes.patch(
  "/:protocol/assignee",
  authMiddleware,
  requirePermission("request:assign"),
  patchAssignee,
);

// Acompanhamento do solicitante (contrato `contract-pendencias_03.md` §3):
// dual-auth (cookie de sessão OU header `X-Requester-Identity`). Declarado
// antes de `/:protocol` para não ser capturado por engano.
requestsRoutes.get("/:protocol/tracking", requesterDualAuth, getTracking);

// Motor de Status: request:status_change e Custódia são resolvidos no service;
// alvos restritos ou fora do fluxo exigem request:status_override global.
requestsRoutes.patch(
  "/:protocol/status",
  authMiddleware,
  requirePermission("request:status_change"),
  patchRequestStatus,
);

requestsRoutes.get("/:protocol", requireAccessMode(), getRequestsByProtocol);
requestsRoutes.get(
  "/:protocol/internal",
  authMiddleware,
  requirePermission("request:read"),
  getInternalRequestByProtocol,
);
// Atualização interna dos blocos editáveis; o service aplica Custódia assigned/all.
requestsRoutes.patch(
  "/:protocol/internal",
  authMiddleware,
  requirePermission("request:write"),
  patchInternalRequestByProtocol,
);

// O guard vem antes do `uploadFields` para não processar multipart de uma
// requisição que será rejeitada por falta de sessão.
requestsRoutes.post("/", requireAccessMode(), uploadFields, postRequest);

export default requestsRoutes;
