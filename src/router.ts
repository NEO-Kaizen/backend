import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";
import requestRoutes from "./modules/requests/requests.router.ts"

const router = Router();

router.use("/auth", authRoutes);

router.use("/request", requestRoutes)

export default router;