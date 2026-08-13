import type { Request, Response } from "express";
import * as authService from "./auth.service.ts";
import { generateToken } from "../../shared/utils/jwtUtil.ts";
import Config from "../../configs.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import type { LoginRequestDTO } from "../DTOs/auth/LoginRequest.dto.ts";

export const autenticate = async (req: Request, res: Response) => {
  const user: LoginRequestDTO = req.body;

  if (!user || !user.email || !user.password) {
    const message = "Usuario/senha não podem ser vazios";
    throw new AppError(message, 400)
  }
  const foundUser = await authService.findUser(user);

  const sessionToken = generateToken(foundUser);

  res.cookie(Config.COOKIE_NAME, sessionToken, { maxAge: Config.COOKIE_MAX_AGE, httpOnly: true });

  return res.status(200).json(foundUser);
};
