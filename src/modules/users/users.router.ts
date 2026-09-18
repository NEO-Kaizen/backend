import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  changeUserStatus,
  createUser,
  getUserMetrics,
  listAnalysts,
  listUsers,
  resetUserPassword,
} from "./users.controller.ts";

const usersRoutes = express.Router();

// Lista para modal de atribuição — contrato contract-assign-action.md
// Sem query, sem paginação, todos com profile === "Analista", isActive=true.
// Autenticado, qualquer perfil interno logado pode listar (modal triagem).
usersRoutes.get("/analysts", authMiddleware, listAnalysts);

usersRoutes.use(authMiddleware);
usersRoutes.use(requireRole("Administrador"));

usersRoutes.get("/metrics", getUserMetrics);
usersRoutes.get("/", listUsers);
usersRoutes.post("/", createUser);
usersRoutes.patch("/:id/status", changeUserStatus);
usersRoutes.post("/:id/reset-password", resetUserPassword);

export default usersRoutes;
