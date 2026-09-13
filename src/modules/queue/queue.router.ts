import express from "express";
const queueRoutes = express.Router();

import { centralizedQueue, getMetricsController } from "./queue.controller.ts";
import { authMiddleware } from "../../shared/middleware/auth.ts";


queueRoutes.get('/metrics', authMiddleware, getMetricsController);

queueRoutes.get("/", authMiddleware, centralizedQueue);


export default queueRoutes;