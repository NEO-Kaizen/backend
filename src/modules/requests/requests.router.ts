import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
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
// Na listagem, `identifyInPublic` resolve a sessão também em PUBLIC: o fluxo
// anônimo por `?email=` continua igual, mas o solicitante logado fica restrito
// ao próprio e-mail (403 no service).
requestsRoutes.get("/", requireAccessMode({ identifyInPublic: true }), getRequestsByEmail);

// Responsáveis pela triagem — lista de profissionais (issue #50).
requestsRoutes.get(
  "/assignees",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  getAssignees,
);

// Contrato contract-assign-action.md: PATCH /requests/:protocol/internal/assignee com body {assigneeId} | {mappingAssigneeId} (user_id string, XOR, null para remover)
// issue #124: a autorização por atribuição (ANALYST_ASSIGNEE triagem OU
// mapeamento, ou Administrador) é feita no service — Gestor não atribui
// (403 no service). Mantida rota legada /:protocol/assignee.
requestsRoutes.patch(
  "/:protocol/internal/assignee",
  authMiddleware,
  requireRole("Analista", "Administrador"),
  patchInternalAssignee,
);

requestsRoutes.patch(
  "/:protocol/assignee",
  authMiddleware,
  requireRole("Analista", "Administrador"),
  patchAssignee,
);

// Acompanhamento do solicitante (contrato `contract-pendencias_03.md` §3):
// dual-auth (cookie de sessão OU header `X-Requester-Identity`). Declarado
// antes de `/:protocol` para não ser capturado por engano.
requestsRoutes.get("/:protocol/tracking", requesterDualAuth, getTracking);

// Motor de Status v4 (issue #124, delta §3.3): troca de status única.
// Autorização no service: Administrador (bypass) ou responsável com custódia
// (free). Claim órfão (permitir designado editar) fica como pendência no PR.
requestsRoutes.patch(
  "/:protocol/status",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  patchRequestStatus,
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
// Atualização interna dos blocos editáveis (issue #88). Perfis internos passam
// pelo requireRole; a autorização por atribuição (issue #121) acontece no
// service: Administrador/Gestor editam qualquer; Analista só as próprias.
requestsRoutes.patch(
  "/:protocol/internal",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  patchInternalRequestByProtocol,
);

// O guard vem antes do `uploadFields` para não processar multipart de uma
// requisição que será rejeitada por falta de sessão.
requestsRoutes.post("/", requireAccessMode(), uploadFields, postRequest);

export default requestsRoutes;
