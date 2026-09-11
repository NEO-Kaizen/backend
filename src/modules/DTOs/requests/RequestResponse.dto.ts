import type { RequestStatus } from "../../../shared/types/requests.ts";

export interface CreateRequestResponse {
  protocol: string;        // "MAAT-8K3P-9X2M" — protocolo único de rastreio,
                           // não enumerável (FPE/Feistel sobre o ID interno —
                           // Especificação 3.0 §5.2)
  status: RequestStatus;   // "Solicitação enviada"
  createdAt: string;       // ISO datetime
};
