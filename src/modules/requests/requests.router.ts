import express from "express";
const publicTrackingRoutes = express.Router();

import { getRequestsByProtocol } from "./requests.controller.ts";

publicTrackingRoutes.get("/:protocol", getRequestsByProtocol);

export default publicTrackingRoutes;
