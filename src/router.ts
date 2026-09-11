import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";
import requestsRoutes from "./modules/requests/requests.router.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/requests", requestsRoutes);

export default router;
