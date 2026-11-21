import type { RequestPriority } from "../../../shared/types/requests.ts";
import type { StatusTone } from "../../../shared/types/systemTheme.ts";

export type DashboardSituation = "open" | "closed" | "overdue" | "unassigned";

/**
 * Filtro de prioridade do dashboard.
 * `"unassigned"` significa "solicitações ainda não priorizadas" (sentinela do
 * contrato `dashboard-metrics-contract.md`), não "sem responsável".
 */
export type DashboardPriorityFilter = number | "unassigned";

export interface DashboardQuery {
  from?: string;
  to?: string;
  situation?: DashboardSituation;
  statusId?: number;
  categoryId?: number;
  priorityId?: DashboardPriorityFilter;
}

export interface DashboardSummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  unassigned: number;
}

export interface DashboardStatusMetric {
  id: number;
  name: string;
  count: number;
  tone: StatusTone;
  /**
   * Nome legado de `statuses.is_terminal` (ver `dashboard-metrics-contract.md`).
   * O Motor de Status v4 expõe o mesmo conceito como `isTerminal` em
   * `PortalStatus`; mantido por compatibilidade do contrato do dashboard.
   */
  closesRequest: boolean;
}

export interface DashboardPriorityMetric {
  id: number | null;
  label: RequestPriority | "Não priorizada";
  count: number;
}

export interface DashboardFilterOptions {
  statuses: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  priorities: Array<{ id: number; label: RequestPriority }>;
}

export interface DashboardCategoryMetric {
  id: number;
  name: string;
  count: number;
}

export interface DashboardTrendPoint {
  period: string;
  count: number;
}

export interface DashboardResponse {
  filters: {
    from: string | null;
    to: string | null;
    situation: DashboardSituation | null;
    statusId: number | null;
    categoryId: number | null;
    priorityId: DashboardPriorityFilter | null;
  };
  filterOptions: DashboardFilterOptions;
  summary: DashboardSummary;
  byStatus: DashboardStatusMetric[];
  byPriority: DashboardPriorityMetric[];
  byCategory: DashboardCategoryMetric[];
  openedOverTime: DashboardTrendPoint[];
}
