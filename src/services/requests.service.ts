import * as RequestRepository from "../modules/requests/requests.repository.ts";
import { AppError } from "../shared/errors/AppError.ts";
import type { trackPublicRequestDTO } from "../modules/DTOs/requests/Request.dto.ts";

export async function findRequest(request: trackPublicRequestDTO) {
  const normalizedEmail = request.email.trim().toLowerCase();
  const protocol = request.protocol;

  const response = await RequestRepository.findRequestByProtocol(protocol, normalizedEmail);

  if (!response) {
    throw new AppError("Protocolo e Email não encontrado", 404);
  }

  return response;
}
