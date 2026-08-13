import express from "express";
const authRoutes = express.Router();

import { autenticate } from "./auth.controller.ts";

authRoutes.post("/login", autenticate);

export default authRoutes;
