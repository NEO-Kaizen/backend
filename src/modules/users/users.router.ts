import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { uploadAvatar } from "../../shared/middleware/uploadAvatar.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import {
  changeUserStatus,
  createUser,
  getMyProfile,
  getUser,
  getUserMetrics,
  listAssignableProfessionals,
  listUsers,
  resetUserPassword,
  updateMyProfile,
  updateUser,
} from "./users.controller.ts";

const usersRoutes = express.Router();

// Diretório de Responsáveis: Perfil com flag + predicado, conta ativa e extensão.
usersRoutes.get(
  "/analysts",
  authMiddleware,
  requirePermission("assignee_directory:read"),
  listAssignableProfessionals,
);

// Issue #125 — "Meus dados" (self-service, qualquer perfil interno).
usersRoutes.get("/me", authMiddleware, getMyProfile);

usersRoutes.use(authMiddleware);
usersRoutes.put("/me", uploadAvatar, updateMyProfile);

// Contas — leitura por `user:read`, gestão por `user:manage` + matriz de
// contas (§ 4.2). O service decide a autoridade sobre a linha.
usersRoutes.get("/metrics", requirePermission("user:read"), getUserMetrics);
usersRoutes.get("/", requirePermission("user:read"), listUsers);
usersRoutes.get("/:id", requirePermission("user:read"), getUser);
usersRoutes.post("/", requirePermission("user:manage"), createUser);
usersRoutes.put("/:id", requirePermission("user:manage"), updateUser);
usersRoutes.patch("/:id/status", requirePermission("user:manage"), changeUserStatus);
usersRoutes.post("/:id/reset-password", requirePermission("user:manage"), resetUserPassword);

export default usersRoutes;
