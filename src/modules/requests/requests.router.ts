import express from "express";
const publicTrackingRoutes = express.Router();

import { trackPublicRequest } from "../../controllers/requests.controller.ts";

publicTrackingRoutes.get("/requests/:protocol", trackPublicRequest);

export default publicTrackingRoutes;