import { Router } from "express";
import authRoutes from "./modules/auth/auth.router.ts";
import requestsRoutes from "./modules/requests/requests.router.ts";
import triageRoutes from "./modules/requests/triage/triage.router.ts";
import usersRoutes from "./modules/users/users.router.ts";
import queueRoutes from "./modules/queue/queue.router.ts";
import prioritizationRoutes from "./modules/prioritization/prioritization.router.ts";
import portalConfigRoutes from "./modules/portalConfig/portalConfig.router.ts";
import internalNotesRoutes from "./modules/internalNotes/internalNotes.router.ts";
import reportsRoutes from "./modules/reports/reports.router.ts";
import pendingItemsRoutes, {
  publicVerifyRouter,
} from "./modules/pendingItems/pendingItems.router.ts";
import auditHistoryRoutes from "./modules/auditHistory/auditHistory.router.ts";

const router = Router();

router.use("/prioritization", prioritizationRoutes);

router.use("/auth", authRoutes);
router.use("/requests/:protocol/internal-notes", internalNotesRoutes);
router.use("/requests/:protocol/pending-items", pendingItemsRoutes);
router.use("/requests/:protocol/public", publicVerifyRouter);
router.use("/requests", requestsRoutes);
router.use("/requests", triageRoutes);
router.use("/users", usersRoutes);

router.use("/queue", queueRoutes);
router.use("/portal-config", portalConfigRoutes);
router.use("/reports", reportsRoutes);
router.use("/audit-history", auditHistoryRoutes);

export default router;
