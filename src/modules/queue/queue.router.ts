import express from "express";
const queueRoutes = express.Router();

import { centralizedQueue } from "./queue.controller.ts";
import { authMiddleware } from "../../shared/middleware/auth.ts";

queueRoutes.get("/", authMiddleware, centralizedQueue);


export default queueRoutes;
