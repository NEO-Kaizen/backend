import type { Request, Response } from "express";
import * as authService from "./auth.service.ts";
import { generateToken } from "../../shared/utils/jwtUtil.ts";
import Config from "../../configs.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { changePasswordSchema, loginSchema } from "./auth.schema.ts";

const COOKIE_OPTIONS = {
  maxAge: Config.COOKIE_MAX_AGE,
  httpOnly: true,
  sameSite: "lax",
  secure: Config.NODE_ENV === "production",
} as const;

function authedUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return Number(req.user.id);
}

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(Config.COOKIE_NAME, { httpOnly: true });
  return res.status(200).json({ message: "Sessão encerrada com sucesso" });
};

export const authenticate = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const foundUser = await authService.authenticate(parsed.data);

  if (foundUser.mustChangePassword) {
    const changeToken = generateToken({
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      password_changed_at: foundUser.passwordChangedAt,
      scope: "change_password",
    });

    res.cookie(Config.COOKIE_NAME, changeToken, COOKIE_OPTIONS);

    return res.status(200).json({
      mustChangePassword: true,
      id: foundUser.id,
      email: foundUser.email,
    });
  }

  const sessionToken = generateToken({
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role,
    password_changed_at: foundUser.passwordChangedAt,
    scope: "session",
  });

  res.cookie(Config.COOKIE_NAME, sessionToken, COOKIE_OPTIONS);

  return res.status(200).json({
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role,
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const userId = authedUserId(req);
  const updated = await authService.changePassword(userId, parsed.data, req.ip);

  const sessionToken = generateToken({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    password_changed_at: updated.passwordChangedAt,
    scope: "session",
  });

  res.cookie(Config.COOKIE_NAME, sessionToken, COOKIE_OPTIONS);

  return res.status(200).json(updated);
};
