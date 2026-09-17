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

export interface ListRequestsQuery {
  email: string;
  status?: string;
  page: number;
  pageSize: number;
}

/**
 * Entrada do service de listagem. `email` é opcional porque no modo
 * `AUTHENTICATED` o e-mail vem da sessão (não da query); em `PUBLIC`, o
 * controller já garante a presença do parâmetro.
 */
export type ListRequestsInput = Omit<ListRequestsQuery, "email"> & { email?: string };
