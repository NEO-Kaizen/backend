import express from "express";
import { uploadFields } from "../../shared/middleware/upload.ts";
import { getRequestsByEmail, getRequestsByProtocol, postRequest } from "./requests.controller.ts";

const requestsRoutes = express.Router();

requestsRoutes.get("/", getRequestsByEmail);
requestsRoutes.get("/:protocol", getRequestsByProtocol);
requestsRoutes.post("/", uploadFields, postRequest);

export default requestsRoutes;
