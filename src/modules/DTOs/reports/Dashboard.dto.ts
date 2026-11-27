import type { RequestPriority } from "../../../shared/types/requests.ts";
import type { StatusTone } from "../../../shared/types/systemTheme.ts";

export type DashboardSituation = "open" | "closed" | "overdue" | "unassigned";

export interface DashboardQuery {
  from?: string;
  to?: string;
  situation?: DashboardSituation;
  statusId?: number;
  categoryId?: number;
  priorityId?: number | "unassigned";
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
    priorityId: number | "unassigned" | null;
  };
  filterOptions: DashboardFilterOptions;
  summary: DashboardSummary;
  byStatus: DashboardStatusMetric[];
  byPriority: DashboardPriorityMetric[];
  byCategory: DashboardCategoryMetric[];
  openedOverTime: DashboardTrendPoint[];
}
