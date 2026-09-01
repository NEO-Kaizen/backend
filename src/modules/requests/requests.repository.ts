import db from "../../database/conection.ts";
import type { RequestDetail } from "../DTOs/requests/RequestResponse.dto.ts";

export async function findRequestByProtocol(protocol: string): Promise<RequestDetail | null> {
  const response = await db("solicitacao as s")
    .leftJoin("solicitante as solicitante", "solicitante.id", "s.solicitante_id")
    .leftJoin("solicitante as responsavel", "responsavel.id", "s.responsavel_id")
    .leftJoin("analise_viabilidade as av", "av.solicitacao_id", "s.id")
    .select(
      "s.protocolo as protocol",
      "s.titulo_resumido as demandTitle",
      "s.nome_processo_atual as processName",
      "s.status as status",
      "responsavel.nome_completo as assigneeName",
      "s.data_abertura as openedAt",
      "s.prazo_desejado as estimatedCompletion",
      "av.agendar_mapeamento_na_data as mappingDate",
      "av.link_reuniao as meetingLink",
      "av.observacoes as lastTechnicalMessage", //Confirmar com o front e DB se lastTechnicalMessage são de fato as "observações"
      "s.ultima_atualizacao as lastUpdate",
      "solicitante.email_corporativo as requesterEmail",
    )
    .where("s.protocolo", protocol)
    .first();

  if (!response) {
    return null;
  }

  const meeting = response.meetingLink
    ? {
        scheduledFor: response.mappingDate ?? response.openedAt ?? new Date().toISOString(),
        link: response.meetingLink,
      }
    : null;

  return {
    protocol: response.protocol,
    demandTitle: response.demandTitle ?? "",
    processName: response.processName ?? "",
    status: response.status,
    assigneeName: response.assigneeName ?? null,
    openedAt: response.openedAt ?? new Date().toISOString(),
    estimatedCompletion: response.estimatedCompletion ?? null,
    mappingDate: response.mappingDate ?? null,
    meeting,
    pendingIssues: [],
    nextStep: "Aguarde o contato do analista",
    lastTechnicalMessage: response.lastTechnicalMessage ?? null, 
    lastUpdate: response.lastUpdate ?? response.openedAt ?? new Date().toISOString(),
    conclusion: null,
  } as RequestDetail;
}