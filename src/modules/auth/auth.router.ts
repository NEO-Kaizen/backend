import express from "express";
const authRoutes = express.Router();

import { autenticate, logout } from "./auth.controller.ts";

authRoutes.post("/login", autenticate);
authRoutes.post("/logout", logout);

export default authRoutes;
