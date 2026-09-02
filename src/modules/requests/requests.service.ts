import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";
import * as repository from "./requests.repository.ts";

export async function registerRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
) {
  // ver como vai salvar no repository, não pode esqucer de usar a função de remover os arquivos caso o banco de algum erro na hora de salvar
  
  let requester = await repository.findRequesterByEmail(request.requester.corporateEmail);

  if(!requester){
    const requesterId = await repository.saveRequester(request.requester);
    return repository.saveRequest(request, requesterId);
  }
  
  return repository.saveRequest(request, requester.id);
}
