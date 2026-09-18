import type {
  ComplementaryBlock,
  DemandBlock,
  OperationalBlock,
  RequesterBlock,
  SchedulePreferences,
} from "../../../shared/types/requests.ts";

export interface CreateRequestPayload {
  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
  schedulePreferences?: SchedulePreferences; // até 3 horários
}

// Bloco `requester` do PATCH /requests/:protocol/internal — apenas os campos
// editáveis. `fullName`/`corporateEmail` são imutáveis: o frontend os envia
// com o valor original e o backend os ignora (Zod strip no schema).
export interface UpdateRequesterBlock {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string;
}

// Payload do PATCH /requests/:protocol/internal — mesmos blocos do GET interno
// (issue #48), apenas os editáveis. Semântica de substituição completa: chave
// ausente = campo limpo (persistir NULL).
export interface UpdateInternalRequestPayload {
  requester: UpdateRequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
}

export interface ListRequestsQuery {
  email: string;
  status?: string;
  page: number;
  pageSize: number;
}
