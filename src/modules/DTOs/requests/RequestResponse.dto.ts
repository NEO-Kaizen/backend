import type {RequestStatus, TriageResult} from "../../../shared/types/requests.ts";

export interface RequestDetail {
  protocol: string;             // "MAAT-8K3P-9X2M" — protocolo único de rastreio
                                // (FPE/Feistel — Especificação 3.0 §5.2)
  demandTitle: string;          // título resumido / nome da demanda
  processName: string;
  status: RequestStatus;        // status público atual
  assigneeName: string | null;  // responsável técnico — null quando não atribuído
                                // ou oculto pelo toggle de visibilidade do responsável
                                // (configurações administrativas — Especificação 3.0 §7.4)
  openedAt: string;             // data de abertura — ISO datetime
  estimatedCompletion: string | null; // previsão de conclusão — ISO "yyyy-mm-dd"
                                      // (fonte: protótipo/issue front — sem base direta na Espec 3.0)
  mappingDate: string | null;   // derivado — parte-data de meeting.scheduledFor quando
                                // houver reunião (conversão no fuso America/Sao_Paulo);
                                // sem reunião, previsão informada pelo analista ou null
                                // ("Previsão ou Data Confirmada" — consulta-de-solicitacao.md)
                                // fluxo consulta-de-solicitacao.md). Provisório:
                                // issue futura de resposta exigirá shape com
                                // identidade por item ({ id, question, answer });
                                // a escrita tende a usar o par protocolo+email
                                // como identidade do solicitante
  nextStep: string;             // instrução orientativa — sempre presente no painel
                                // (fonte: docs/produto/fluxos/consulta-de-solicitacao.md
                                // — ex.: "Aguarde o contato do analista")
  lastTechnicalMessage: string | null; // última mensagem do responsável técnico
                                // (fonte: protótipo/issue front — sem base direta na Espec 3.0)
  lastUpdate: string;           // ISO datetime da última movimentação
  conclusion: {                 // conclusão da análise, quando encerrada
    result: TriageResult;       // veredito formal da triagem ("Resultado da Triagem")
    justification: string;      // texto consolidado conclusaoAnalise — máx. 4.000 (§4)
  } | null;
}