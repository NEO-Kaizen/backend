import db from "../../database/conection.ts";
import { findAssignableProfileIds } from "../../shared/access/assignability.ts";
import type { FindQueueParams } from "../DTOs/queue/queue.dto.ts";
import type { QueueItem, QueueMetricsResponse } from "../../shared/types/queue.types.ts";
import { applyQueueFilters } from "./queue.filters.ts";
import { applyQueueSort } from "./queue.sort.ts";

/**
 * Status que contam como "em andamento" nas métricas da fila (Home/Fila).
 *
 * TODO: esta lista inclui status não-core — 8 (`Em análise de viabilidade`),
 * 14 (`Em desenvolvimento`) e 15 (`Em homologação`) — e compara por nome, então
 * renomear/desativar/repurposar um deles altera a métrica silenciosamente.
 * Substituir por uma flag `is_in_progress` na tabela `statuses` (decisão de
 * produto) e remover esta constante. Até lá, a lista fica local à consulta para
 * não virar contrato compartilhado.
 */
const IN_PROGRESS_STATUS_NAMES = [
  "Em triagem",
  "Em mapeamento",
  "Em análise de viabilidade",
  "Em desenvolvimento",
  "Em homologação",
] as const;

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
        `COUNT(CASE WHEN s.name IN (${IN_PROGRESS_STATUS_NAMES.map(() => "?").join(",")}) THEN 1 END)::int as "inProgressRequests"`,
        [...IN_PROGRESS_STATUS_NAMES],
      ),
      // Atrasadas: prazo (`date`) já vencido — vence hoje ainda não é atraso —
      // e status não terminal (flag do catálogo v4).
      db.raw(
        'COUNT(CASE WHEN requests.desired_deadline < CURRENT_DATE AND s.is_terminal = FALSE THEN 1 END)::int as "overdueRequests"',
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

  const itemsQuery = baseQuery.select(
    "requests.protocol",
    "requests.created_at as createdAt",
    "requests.process_name as processName",
    "priority_tbl.level as priority",
    "status.name as status",
    // Expor user_id como assigneeId conforme `docs/rules/assignment.md` (frontend usa user_id)
    db.raw('assignee_user.user_id::text as "assigneeId"'),
    "assignee_user.full_name as assignee",
    "requester.full_name as requesterName",
    "requester.corporate_email as requesterEmail",
  );

  applyQueueSort(itemsQuery, params.sortBy, params.sortOrder);
  itemsQuery.limit(limit).offset(offset);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);
  const total = countResult ? Number(countResult.total) : 0;

  return { items, total };
};

/**
 * Departamentos distintos e globais do solicitante, sem depender dos filtros
 * nem da paginação da fila. A deduplicação é case-insensitive, alinhada ao
 * filtro `department`; valores com caixas diferentes preservam a primeira
 * grafia em ordem alfabética.
 */
export const fetchAllDepartments = async (): Promise<string[]> => {
  const rows = (await db("requests")
    .join("requesters as requester", "requester.requester_id", "requests.requester_id")
    .select(db.raw(`trim(requester.department) as department`))
    .whereNotNull("requester.department")
    .andWhereRaw("trim(requester.department) <> ''")
    .distinct()
    .orderByRaw("trim(requester.department) asc")) as Array<{ department: string }>;

  const seen = new Set<string>();
  return rows
    .map((row) => row.department)
    .filter((department) => {
      const key = department.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
