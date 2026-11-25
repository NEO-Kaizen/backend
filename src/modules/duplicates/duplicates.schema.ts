import { z } from "zod";
import { demandSchema } from "../requests/requests.schema.ts";

/**
 * Corpo estrito de `POST /requests/duplicates/check` (issue #209).
 *
 * Reutiliza o bloco de Demanda da abertura e rejeita qualquer chave
 * desconhecida no root ou dentro de `demand` (`422`).
 */
export const duplicateCheckPayloadSchema = z
  .object({
    demand: demandSchema.strict(),
  })
  .strict();
