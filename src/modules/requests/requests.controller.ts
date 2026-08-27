import type { Request, Response } from "express";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import type { CreateRequestResponse } from "../DTOs/requests/RequestResponse.dto.ts";

export const postRequest = async (req: Request, res: Response): Promise<void> => {
  const request: CreateRequestPayload = req.body;

   // Garante que o corpo não está vazio antes de rodar o forEach
  if (!request || Object.keys(request).length === 0) {
    throw new AppError("O corpo da requisição não pode estar vazio.", 400);
  };

  Object.keys(request).forEach(
    (key) => {if(!request[key as keyof CreateRequestPayload]) {
        throw new AppError( `O campo '${key}' é obrigatório.`, 400)
    }}
  );

//   const response: CreateRequestResponse = ;
//   return res.status(201).json(response)
};