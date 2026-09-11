import express from "express";
const publicTrackingRoutes = express.Router();

import { trackPublicRequest } from "./requests.controller.ts";

publicTrackingRoutes.get("/:protocol", trackPublicRequest);

export default publicTrackingRoutes;
