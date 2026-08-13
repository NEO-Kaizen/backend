import type { User } from "../../shared/types/user.ts";
import type { Request, Response } from "express";
import * as authService from "./auth_service.ts";
import { generateToken } from "../../shared/utils/jwtUtil.ts";
import Config from "../../configs.ts";
import { AppError } from "../../shared/errors/AppError.ts";

export const autenticate = async (req: Request, res: Response) => {
  const user: User = req.body;

  if (!user || !user.email || !user.password) {
    const message = "Usuario/senha não podem ser vazios";
    throw new AppError(message, 400)
  }
  const foundUser = await authService.findUser(user);

  const sessionToken = generateToken(foundUser);

  res.cookie(Config.COOKIE_NAME, sessionToken, { maxAge: Config.COOKIE_MAX_AGE, httpOnly: true });

  return res.status(200).json(foundUser);
};
