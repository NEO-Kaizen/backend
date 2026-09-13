import type { Request, Response } from "express";
import * as requestsService from "./requests.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";

export const getByProtocol = async (req: Request, res: Response) => {
  const { protocol } = req.params;

  if (!protocol || typeof protocol !== "string") {
    throw new AppError("Protocolo não pode ser vazio", 400);
  }

  const request = await requestsService.findByProtocol(protocol);

  return res.status(200).json(request);
};
