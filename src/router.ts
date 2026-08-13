import { Router } from "express";
import authRoutes from "./modules/auth/auth_router.ts";

const router = Router();

router.use("/auth", authRoutes);

export default router;
