import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";
import * as repository from "./requests.repository.ts";

export async function registerRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
) {
  try {
    const requester = await repository.findRequesterByEmail(request.requester.corporateEmail);

    if (!requester) {
      const requesterId = await repository.saveRequester(request.requester);
      return await repository.saveRequest(request, requesterId);
    }

    return await repository.saveRequest(request, requester.id);
  } catch (err) {
    await removeFiles(attachments);
    throw err;
  }
}
