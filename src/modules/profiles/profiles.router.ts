import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import {
  changeProfileStatus,
  createProfile,
  duplicateProfile,
  getKeyCatalog,
  getProfile,
  listProfiles,
  updateProfile,
} from "./profiles.controller.ts";

const profilesRoutes = express.Router();

profilesRoutes.use(authMiddleware);

// `/keys` é declarada antes de `/:id` para não ser capturada pelo parâmetro.
profilesRoutes.get("/keys", requirePermission("profile:read"), getKeyCatalog);
profilesRoutes.get("/", requirePermission("profile:read"), listProfiles);
profilesRoutes.get("/:id", requirePermission("profile:read"), getProfile);

profilesRoutes.post("/", requirePermission("profile:manage"), createProfile);
profilesRoutes.patch("/:id", requirePermission("profile:manage"), updateProfile);
profilesRoutes.patch("/:id/status", requirePermission("profile:manage"), changeProfileStatus);
profilesRoutes.post("/:id/duplicate", requirePermission("profile:manage"), duplicateProfile);

export default profilesRoutes;
