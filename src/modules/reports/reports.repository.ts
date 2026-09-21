import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { DashboardQuery } from "../DTOs/reports/Dashboard.dto.ts";

const BUSINESS_TIME_ZONE = "America/Sao_Paulo";
const OPENED_MONTH_SQL = `DATE_TRUNC(
  'month',
  r.created_at AT TIME ZONE '${BUSINESS_TIME_ZONE}'
)`;

interface DashboardSummaryRow {
  total: number | string;
  open: number | string;
  closed: number | string;
  overdue: number | string;
  unassigned: number | string;
}

interface DashboardStatusRow {
  id: number | string;
  name: string;
  count: number | string;
  tone: string;
  closesRequest: boolean;
}

interface DashboardPriorityRow {
  id: number | string | null;
  label: string;
  count: number | string;
}

interface DashboardCategoryRow {
  id: number | string;
  name: string;
  count: number | string;
}

interface DashboardTrendRow {
  period: string;
  count: number | string;
}

interface DashboardStatusOptionRow {
  id: number | string;
  name: string;
}

interface DashboardCategoryOptionRow {
  id: number | string;
  name: string;
}

interface DashboardPriorityOptionRow {
  id: number | string;
  label: string;
}

export interface DashboardFilterOptionRows {
  statuses: DashboardStatusOptionRow[];
  categories: DashboardCategoryOptionRow[];
  priorities: DashboardPriorityOptionRow[];
}

function applyDashboardFilters(query: Knex.QueryBuilder, filters: DashboardQuery): void {
  if (filters.from) {
    query.whereRaw(`r.created_at >= (?::date AT TIME ZONE ?)`, [filters.from, BUSINESS_TIME_ZONE]);
  }

  if (filters.to) {
    query.whereRaw(`r.created_at < ((?::date + INTERVAL '1 day') AT TIME ZONE ?)`, [
      filters.to,
      BUSINESS_TIME_ZONE,
    ]);
  }

  if (filters.situation === "open") {
    query.where("s.closes_request", false);
  } else if (filters.situation === "closed") {
    query.where("s.closes_request", true);
  } else if (filters.situation === "overdue") {
    query
      .where("s.closes_request", false)
      .whereRaw(`r.desired_deadline < (CURRENT_TIMESTAMP AT TIME ZONE ?)::date`, [
        BUSINESS_TIME_ZONE,
      ]);
  } else if (filters.situation === "unassigned") {
    query.where("s.closes_request", false).whereNull("r.professional_id");
  }

  if (filters.statusId) {
    query.where("r.status_id", filters.statusId);
  }

  if (filters.categoryId) {
    query.where("r.category_id", filters.categoryId);
  }

  if (filters.priorityId === "unassigned") {
    query.whereNull("r.priority_id");
  } else if (filters.priorityId) {
    query.where("r.priority_id", filters.priorityId);
  }
}

export async function fetchDashboardSummary(
  filters: DashboardQuery,
): Promise<DashboardSummaryRow | undefined> {
  const query = db("requests as r")
    .join("statuses as s", "s.status_id", "r.status_id")
    .select(
      db.raw('COUNT(*)::int AS "total"'),
      db.raw('COUNT(*) FILTER (WHERE NOT s.closes_request)::int AS "open"'),
      db.raw('COUNT(*) FILTER (WHERE s.closes_request)::int AS "closed"'),
      db.raw(
        `COUNT(*) FILTER (
          WHERE NOT s.closes_request
            AND r.desired_deadline < (CURRENT_TIMESTAMP AT TIME ZONE ?)::date
        )::int AS "overdue"`,
        [BUSINESS_TIME_ZONE],
      ),
      db.raw(
        `COUNT(*) FILTER (
          WHERE NOT s.closes_request AND r.professional_id IS NULL
        )::int AS "unassigned"`,
      ),
    )
    .first<DashboardSummaryRow>();

  applyDashboardFilters(query, filters);
  return query;
}

export async function fetchDashboardByStatus(
  filters: DashboardQuery,
): Promise<DashboardStatusRow[]> {
  const query = db("requests as r")
    .join("statuses as s", "s.status_id", "r.status_id")
    .select(
      "s.status_id as id",
      "s.name",
      "s.tone",
      "s.closes_request as closesRequest",
      db.raw('COUNT(*)::int AS "count"'),
    )
    .groupBy("s.status_id", "s.name", "s.tone", "s.closes_request", "s.order_number")
    .orderBy("s.order_number", "asc");

  applyDashboardFilters(query, filters);
  return query;
}

export async function fetchDashboardByPriority(
  filters: DashboardQuery,
): Promise<DashboardPriorityRow[]> {
  const query = db("requests as r")
    .leftJoin("priorities as p", "p.priority_id", "r.priority_id")
    .join("statuses as s", "s.status_id", "r.status_id")
    .select("p.priority_id as id", db.raw(`COALESCE(p.level, 'Não priorizada') AS "label"`))
    .select(db.raw('COUNT(*)::int AS "count"'))
    .groupBy("p.priority_id", "p.level", "p.min_score")
    .orderByRaw("p.min_score ASC NULLS LAST");

  applyDashboardFilters(query, filters);
  return query;
}

export async function fetchDashboardByCategory(
  filters: DashboardQuery,
): Promise<DashboardCategoryRow[]> {
  const query = db("requests as r")
    .join("categories as c", "c.category_id", "r.category_id")
    .join("statuses as s", "s.status_id", "r.status_id")
    .select("c.category_id as id", "c.name", db.raw('COUNT(*)::int AS "count"'))
    .groupBy("c.category_id", "c.name", "c.display_order")
    .orderBy("c.display_order", "asc");

  applyDashboardFilters(query, filters);
  return query;
}

export async function fetchDashboardOpenedOverTime(
  filters: DashboardQuery,
): Promise<DashboardTrendRow[]> {
  const query = db("requests as r")
    .join("statuses as s", "s.status_id", "r.status_id")
    .select(
      db.raw(`TO_CHAR(${OPENED_MONTH_SQL}, 'YYYY-MM') AS "period"`),
      db.raw('COUNT(*)::int AS "count"'),
    )
    .groupByRaw(OPENED_MONTH_SQL)
    .orderByRaw(`${OPENED_MONTH_SQL} ASC`);

  applyDashboardFilters(query, filters);
  return query;
}

export async function fetchDashboardFilterOptions(): Promise<DashboardFilterOptionRows> {
  const [statuses, categories, priorities] = await Promise.all([
    db("statuses")
      .select("status_id as id", "name")
      .where({ is_active: true })
      .orderBy("order_number", "asc") as Promise<DashboardStatusOptionRow[]>,
    db("categories")
      .select("category_id as id", "name")
      .where({ status: "active" })
      .orderBy("display_order", "asc") as Promise<DashboardCategoryOptionRow[]>,
    db("priorities")
      .select("priority_id as id", "level as label")
      .orderBy("min_score", "asc") as Promise<DashboardPriorityOptionRow[]>,
  ]);

  return { statuses, categories, priorities };
}
