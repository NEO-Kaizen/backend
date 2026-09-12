import { AppError } from "../../shared/errors/AppError.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type {
  CreateRequestPayload,
  ListRequestsQuery,
} from "../DTOs/requests/RequestRequests.dto.ts";
import type {
  PaginatedResponse,
  RequestDetail,
  RequestSummary,
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

export async function listRequestsByEmail(
  query: ListRequestsQuery,
): Promise<PaginatedResponse<RequestSummary>> {
  const normalizedEmail = query.email.trim().toLowerCase();

  if (query.status && !(await repository.findStatusByName(query.status))) {
    throw new AppError("Status inválido.", 400);
  }

  return repository.findRequestsByRequesterEmail({
    email: normalizedEmail,
    status: query.status,
    page: query.page,
    pageSize: query.pageSize,
  });
}
