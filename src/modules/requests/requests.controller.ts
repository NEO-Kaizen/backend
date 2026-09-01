import type { Request, Response } from "express";
import * as RequestService from "./requests.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";

export const trackPublicRequest = async (req: Request, res: Response) => {
  const protocol = req.params.protocol as string;

  if (!protocol || typeof protocol !== "string" || protocol.trim() === "") {
    throw new AppError("Protocolo é obrigatório", 400);
  }

  const foundRequest = await RequestService.findRequest(protocol);

  return res.status(200).json(foundRequest);
};