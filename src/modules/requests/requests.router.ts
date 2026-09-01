import express from "express";
import { postRequest } from "./requests.controller.ts";
import { uploadFields } from "../../shared/middleware/upload.ts";
const requestsRoutes = express.Router();

requestsRoutes.post("/", uploadFields, postRequest);

export default requestsRoutes;
