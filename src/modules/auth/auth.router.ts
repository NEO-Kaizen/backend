import express from "express";
const authRoutes = express.Router();

import { authenticate, changePassword, logout, me } from "./auth.controller.ts";
import { authMiddleware } from "../../shared/middleware/auth.ts";

authRoutes.post("/login", authenticate);
authRoutes.post("/logout", logout);
authRoutes.get("/me", authMiddleware, me);
authRoutes.put("/change-password", authMiddleware, changePassword);

export default authRoutes;
