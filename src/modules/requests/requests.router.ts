import express from "express";
import { getRequestsByEmail, postRequest } from "./requests.controller.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
const requestsRoutes = express.Router();

requestsRoutes.get("/", getRequestsByEmail);
requestsRoutes.post("/", uploadFields, postRequest);

export default requestsRoutes;
