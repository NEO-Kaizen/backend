import express from "express";
import { getByProtocol } from "./requests.controller.ts";
import { authMiddleware } from "../../shared/middleware/auth.ts";

const requestsRoutes = express.Router();

requestsRoutes.get("/:protocol/internal", authMiddleware, getByProtocol);

export default requestsRoutes;
