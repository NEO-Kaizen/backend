import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";

export async function registerRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
) {
  // ver como vai salvar no repository, não pode esqucer de usar a função de remover os arquivos caso o banco de algum erro na hora de salvar
}
