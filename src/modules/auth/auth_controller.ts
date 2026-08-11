import type { User } from "../../types/user.ts";
import type { Request, Response } from "express";

import * as authService from "./auth_service.ts";


export const autenticate = async (req: Request, res: Response) => {
  const user: User = req.body;

  if (!user.email || !user.password) {
    const error = "Usuario/senha não podem ser vazios";
    return res.status(400).json({ error });
  }
  if (await authService.foundUser(user)) {
    //
  } else {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  return res.status(200).json({ succes: true });
};
