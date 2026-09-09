import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";

import queueRoutes from "./modules/queue/queue.router.ts"

const router = Router();

router.use("/auth", authRoutes);

router.use("/queue", queueRoutes)

export default router;
