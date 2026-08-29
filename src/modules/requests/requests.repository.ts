import db from "../../database/conection.ts";
import type { RequestWithRequesterEmail } from "../DTOs/requests/Request.dto.ts";


export async function findRequestByProtocol(protocol: string, email: string) : Promise<RequestWithRequesterEmail> {
  const response = await db("solicitacoes as p")
    .join("solicitante as s", "s.id", "p.solicitante_id")
    .select(
      "p.protocolo as protocol",
      "p.titulo_resumido as title",
      "p.status",
      "p.data_abertura as created_at",
      "p.ultima_atualizacao as updated_at",
      "s.email as requester_email",
    )
    .where("p.protocolo", protocol)
    .whereRaw("LOWER(s.email) = ?", [email])
    .first();

  return response || null;
}