import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requirePermission } from "../../shared/middleware/requirePermission.ts";
import {
  createInternalNote,
  listInternalNotes,
  markInternalNotesRead,
} from "./internalNotes.controller.ts";

const internalNotesRoutes = express.Router({ mergeParams: true });

internalNotesRoutes.use(authMiddleware);

internalNotesRoutes.get("/", requirePermission("internal_note:read"), listInternalNotes);
internalNotesRoutes.post("/", requirePermission("internal_note:write"), createInternalNote);
internalNotesRoutes.put("/read", requirePermission("internal_note:read"), markInternalNotesRead);

export default internalNotesRoutes;
