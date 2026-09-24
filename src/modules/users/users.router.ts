import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { uploadAvatar } from "../../shared/middleware/uploadAvatar.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  changeUserStatus,
  createUser,
  getMyProfile,
  getUser,
  getUserMetrics,
  listAnalysts,
  listUsers,
  resetUserPassword,
  updateMyProfile,
  updateUser,
} from "./users.controller.ts";

const usersRoutes = express.Router();

// Lista para modal de atribuição — contrato contract-assign-action.md
// Sem query, sem paginação, todos com profile === "Analista", isActive=true.
// Autenticado, qualquer perfil interno logado pode listar (modal triagem).
usersRoutes.get("/analysts", authMiddleware, listAnalysts);

// Issue #125 — "Meus dados" (self-service, qualquer perfil interno).
usersRoutes.get("/me", authMiddleware, getMyProfile);

usersRoutes.use(authMiddleware);
usersRoutes.put("/me", uploadAvatar, updateMyProfile);
usersRoutes.use(requireRole("Administrador"));

usersRoutes.get("/metrics", getUserMetrics);
usersRoutes.get("/", listUsers);
usersRoutes.post("/", createUser);
usersRoutes.get("/:id", getUser);
usersRoutes.put("/:id", updateUser);
usersRoutes.patch("/:id/status", changeUserStatus);
usersRoutes.post("/:id/reset-password", resetUserPassword);

export default usersRoutes;
