import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { uploadAssetFields, validateAssetSizes } from "../../shared/middleware/uploadAssets.ts";
import {
  getConfig,
  updateAccess,
  updateAssets,
  updateCategories,
  updateIdentity,
  updatePrioritizationWeights,
  updateStatuses,
  updateTheme,
} from "./portalConfig.controller.ts";

const portalConfigRoutes = express.Router();

// R1 — GET público (sem auth)
portalConfigRoutes.get("/", getConfig);

// Todos os PATCH exigem Administrador
portalConfigRoutes.use(authMiddleware);
portalConfigRoutes.use(requireRole("Administrador"));

portalConfigRoutes.patch("/access", updateAccess);
portalConfigRoutes.patch("/identity", updateIdentity);
portalConfigRoutes.patch("/theme", updateTheme);
portalConfigRoutes.patch("/assets", uploadAssetFields, validateAssetSizes, updateAssets);
portalConfigRoutes.patch("/categories", updateCategories);
portalConfigRoutes.patch("/statuses", updateStatuses);
portalConfigRoutes.patch("/prioritization-weights", updatePrioritizationWeights);

export default portalConfigRoutes;
