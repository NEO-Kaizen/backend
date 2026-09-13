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
