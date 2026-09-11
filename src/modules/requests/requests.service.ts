import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";
import type { RequestSummaryResponse } from "../DTOs/requests/RequestResponse.dto.ts";
import * as repository from "./requests.repository.ts";

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
