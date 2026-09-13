import express from "express";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
import {
  getInternalRequestByProtocol,
  getRequestsByEmail,
  getRequestsByProtocol,
  postRequest,
} from "./requests.controller.ts";

const requestsRoutes = express.Router();

requestsRoutes.get("/", getRequestsByEmail);
requestsRoutes.get("/:protocol", getRequestsByProtocol);
requestsRoutes.get("/:protocol/internal", authMiddleware, getInternalRequestByProtocol);
requestsRoutes.post("/", uploadFields, postRequest);

export default requestsRoutes;
