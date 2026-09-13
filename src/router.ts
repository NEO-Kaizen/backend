import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";
import requestsRoutes from "./modules/requests/requests.router.ts";
import usersRoutes from "./modules/users/users.router.ts";

import queueRoutes from "./modules/queue/queue.router.ts"

const router = Router();

router.use("/auth", authRoutes);
router.use("/requests", requestsRoutes);
router.use("/users", usersRoutes);

router.use("/queue", queueRoutes)

export default router;
