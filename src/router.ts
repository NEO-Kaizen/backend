import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";
import requestsRoutes from "./modules/requests/requests.router.ts";
import usersRoutes from "./modules/users/users.router.ts";
import priorizationRoutes from "./modules/priorization/priorization.routes.ts";
const router = Router();

router.use("/priorization", priorizationRoutes)

router.use("/auth", authRoutes);
router.use("/requests", requestsRoutes);
router.use("/users", usersRoutes);

export default router;
