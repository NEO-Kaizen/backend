import { AppError } from "../../shared/errors/AppError.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";
import type {
  RequestDetail,
  RequestSummaryResponse,
} from "../DTOs/requests/RequestResponse.dto.ts";
import * as repository from "./requests.repository.ts";

export async function findRequest(protocol: string): Promise<RequestDetail> {
  const normalizedProtocol = protocol.trim();

  const response = await repository.findRequestByProtocol(normalizedProtocol);

  if (!response) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  return response;
}

export async function registerRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
) {
  try {
    return await repository.createRequest(request, attachments);
  } catch (err) {
    await removeFiles(attachments);
    throw err;
  }
}

export async function listRequestsByEmail(email: string): Promise<RequestSummaryResponse[]> {
  const normalizedEmail = email.trim().toLowerCase();

  return repository.findRequestsByRequesterEmail(normalizedEmail);
}
