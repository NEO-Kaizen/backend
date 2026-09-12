import express from "express";
const priorizationRoutes = express.Router();

import { getCriterios, putScorePriorization } from "./priorization.controller.ts";

priorizationRoutes.get("/criteria", getCriterios)
priorizationRoutes.put("/:protocol/score", putScorePriorization)

export default priorizationRoutes;