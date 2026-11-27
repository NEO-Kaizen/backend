import db from "../../database/conection.ts";
import { findAssignableProfileIds } from "../../shared/access/assignability.ts";
import { IN_PROGRESS_STATUSES, TERMINAL_STATUSES } from "../../shared/types/requests.ts";
import type { FindQueueParams } from "../DTOs/queue/queue.dto.ts";
import type { QueueItem, QueueMetricsResponse } from "../../shared/types/queue.types.ts";
import { applyQueueFilters } from "./queue.filters.ts";

export const fetchQueueMetrics = async (scopedUserId?: number): Promise<QueueMetricsResponse> => {
  const query = db("requests").leftJoin("statuses as s", "s.status_id", "requests.status_id");

  // `applyQueueFilters` aplica o mesmo escopo à lista e à exportação:
  // Responsável da solicitação ou do Mapeamento corrente.
  if (scopedUserId !== undefined) {
    query
      .leftJoin(
        "details_professional as assignee",
        "assignee.professional_id",
        "requests.professional_id",
      )
      .leftJoin("users as assignee_user", "assignee_user.user_id", "assignee.user_id");
  }
  applyQueueFilters(query, { scopedUserId });

  const result = await query
    .select(
      db.raw('COUNT(requests.*)::int as "totalRequests"'),
      db.raw(
        'COUNT(CASE WHEN requests.professional_id IS NULL THEN 1 END)::int as "unassignedRequests"',
      ),
      db.raw(
        `COUNT(CASE WHEN s.name IN (${IN_PROGRESS_STATUSES.map(() => "?").join(",")}) THEN 1 END)::int as "inProgressRequests"`,
        [...IN_PROGRESS_STATUSES],
      ),
      // Atrasadas: prazo (`date`) já vencido — vence hoje ainda não é atraso —
      // e status não terminal (sem entrega concluída/cancelada).
      db.raw(
        `COUNT(CASE WHEN requests.desired_deadline < CURRENT_DATE AND s.name NOT IN (${TERMINAL_STATUSES.map(() => "?").join(",")}) THEN 1 END)::int as "overdueRequests"`,
        [...TERMINAL_STATUSES],
      ),
    )
    .first();

  return {
    totalRequests: result?.totalRequests || 0,
    unassignedRequests: result?.unassignedRequests || 0,
    inProgressRequests: result?.inProgressRequests || 0,
    overdueRequests: result?.overdueRequests || 0,
  };
};

export const findQueueRequests = async (
  params: FindQueueParams,
): Promise<{ items: QueueItem[]; total: number }> => {
  const { limit, offset } = params;

  const baseQuery = db("requests")
    .join("requesters as requester", "requester.requester_id", "requests.requester_id")
    .join("statuses as status", "status.status_id", "requests.status_id")
    .leftJoin("priorities as priority_tbl", "priority_tbl.priority_id", "requests.priority_id")
    .leftJoin(
      "details_professional as assignee",
      "assignee.professional_id",
      "requests.professional_id",
    )
    .leftJoin("users as assignee_user", "assignee_user.user_id", "assignee.user_id");

  applyQueueFilters(baseQuery, params);

  const countQuery = baseQuery.clone().count("* as total").first();

  const itemsQuery = baseQuery
    .select(
      "requests.protocol",
      "requests.created_at as createdAt",
      "requests.process_name as processName",
      "priority_tbl.level as priority",
      "status.name as status",
      // Expor user_id como assigneeId para contract-assign-action.md (frontend usa user_id)
      db.raw('assignee_user.user_id::text as "assigneeId"'),
      "assignee_user.full_name as assignee",
      "requester.full_name as requesterName",
      "requester.corporate_email as requesterEmail",
    )
    .orderBy("requests.created_at", "desc")
    .limit(limit)
    .offset(offset);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);
  const total = countResult ? Number(countResult.total) : 0;

  return { items, total };
};

export const fetchAllAssignees = async (): Promise<{ id: string; name: string }[]> => {
  const profileIds = await findAssignableProfileIds({ queryable: db });
  if (profileIds.length === 0) return [];

  return db("details_professional as dp")
    .join("users as u", "u.user_id", "dp.user_id")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("dp.status", "active")
    .andWhere("u.is_active", true)
    .andWhere("p.is_active", true)
    .whereIn("p.profile_id", profileIds)
    .select(db.raw("u.user_id::text as id"), "u.full_name as name")
    .orderBy("u.full_name", "asc");
};
