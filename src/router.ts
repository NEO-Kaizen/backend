import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";
import priorizationRoutes from "./modules/priorization/priorization.routes.ts";

const router = Router();

router.use("/priorization", priorizationRoutes)

router.use("/auth", authRoutes);

export default router;
