import express from "express";
const authRoutes = express.Router();

import { autenticate } from "./auth_controller.ts";

authRoutes.post("/login", autenticate);

export default authRoutes;
