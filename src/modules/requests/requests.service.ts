import * as RequestRepository from "./requests.repository.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import type { RequestDetail } from "../DTOs/requests/RequestResponse.dto.ts";

export async function findRequest(protocol: string): Promise<RequestDetail> {
  const normalizedProtocol = protocol.trim();

  const response = await RequestRepository.findRequestByProtocol(normalizedProtocol);

  if (!response) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  return response;
}