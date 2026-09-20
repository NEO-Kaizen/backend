import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import {
  createInternalNote,
  listInternalNotes,
  markInternalNotesRead,
} from "./internalNotes.controller.ts";

const internalNotesRoutes = express.Router({ mergeParams: true });

internalNotesRoutes.use(authMiddleware);
internalNotesRoutes.use(requireRole("Analista", "Gestor", "Administrador"));

internalNotesRoutes.get("/", listInternalNotes);
internalNotesRoutes.post("/", createInternalNote);
internalNotesRoutes.put("/read", markInternalNotesRead);

export default internalNotesRoutes;
