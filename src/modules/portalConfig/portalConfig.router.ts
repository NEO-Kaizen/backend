import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import type { PermissionKey } from "../../shared/catalog/permissionCatalog.ts";
import {
  requireAnyPermission,
  requirePermission,
} from "../../shared/middleware/requirePermission.ts";
import { uploadAssetFields, validateAssetSizes } from "../../shared/middleware/uploadAssets.ts";
import {
  getAdminConfig,
  getConfig,
  updateAccess,
  updateAssets,
  updateCategories,
  updateIdentity,
  updatePrioritizationWeights,
  updateStatuses,
  updateTheme,
} from "./portalConfig.controller.ts";

/**
 * Chaves de leitura das seções da visão administrativa (contrato RBAC § 3.7).
 * Quem tem ao menos uma delas acessa `GET /portal-config/admin`; a resposta
 * devolve apenas as seções legíveis.
 */
const PORTAL_SECTION_READ_KEYS = [
  "theme:read",
  "category:read",
  "status:read",
  "portal_setting:read",
  "prioritization_config:read",
] as const satisfies readonly PermissionKey[];

const portalConfigRoutes = express.Router();

// R1 — projeção pública da configuração (sem chave, sem sessão).
portalConfigRoutes.get("/", getConfig);

// Visão administrativa e edições exigem sessão; cada seção decide pela própria
// chave (contrato RBAC § 3.7).
portalConfigRoutes.use(authMiddleware);

// R0 — devolve apenas as seções que o ator pode ler.
portalConfigRoutes.get("/admin", requireAnyPermission(PORTAL_SECTION_READ_KEYS), getAdminConfig);

portalConfigRoutes.patch("/access", requirePermission("portal_setting:manage"), updateAccess);
portalConfigRoutes.patch("/identity", requirePermission("portal_setting:manage"), updateIdentity);
portalConfigRoutes.patch("/theme", requirePermission("theme:manage"), updateTheme);
// O gate vem antes do upload para não processar multipart de uma seção negada.
portalConfigRoutes.patch(
  "/assets",
  requirePermission("theme:manage"),
  uploadAssetFields,
  validateAssetSizes,
  updateAssets,
);
portalConfigRoutes.patch("/categories", requirePermission("category:manage"), updateCategories);
portalConfigRoutes.patch("/statuses", requirePermission("status:manage"), updateStatuses);
portalConfigRoutes.patch(
  "/prioritization-weights",
  requirePermission("prioritization_config:manage"),
  updatePrioritizationWeights,
);

export default portalConfigRoutes;
