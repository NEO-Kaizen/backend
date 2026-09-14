import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { changeUserStatus, createUser, listUsers, resetUserPassword } from "./users.controller.ts";

const usersRoutes = express.Router();

usersRoutes.use(authMiddleware);
usersRoutes.use(requireRole("Administrador"));

usersRoutes.get("/", listUsers);
usersRoutes.post("/", createUser);
usersRoutes.patch("/:id/status", changeUserStatus);
usersRoutes.post("/:id/reset-password", resetUserPassword);

export default usersRoutes;
