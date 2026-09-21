import type {
  DashboardPriorityMetric,
  DashboardQuery,
  DashboardResponse,
} from "../DTOs/reports/Dashboard.dto.ts";
import type { RequestPriority } from "../../shared/types/requests.ts";
import type { StatusTone } from "../../shared/types/systemTheme.ts";
import * as repository from "./reports.repository.ts";

export async function getDashboard(filters: DashboardQuery): Promise<DashboardResponse> {
  const [summary, byStatus, byPriority, byCategory, openedOverTime, filterOptions] =
    await Promise.all([
      repository.fetchDashboardSummary(filters),
      repository.fetchDashboardByStatus(filters),
      repository.fetchDashboardByPriority(filters),
      repository.fetchDashboardByCategory(filters),
      repository.fetchDashboardOpenedOverTime(filters),
      repository.fetchDashboardFilterOptions(),
    ]);

  return {
    filters: {
      from: filters.from ?? null,
      to: filters.to ?? null,
      situation: filters.situation ?? null,
      statusId: filters.statusId ?? null,
      categoryId: filters.categoryId ?? null,
      priorityId: filters.priorityId ?? null,
    },
    filterOptions: {
      statuses: filterOptions.statuses.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
      categories: filterOptions.categories.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
      priorities: filterOptions.priorities.map((item) => ({
        id: Number(item.id),
        label: item.label as RequestPriority,
      })),
    },
    summary: {
      total: Number(summary?.total ?? 0),
      open: Number(summary?.open ?? 0),
      closed: Number(summary?.closed ?? 0),
      overdue: Number(summary?.overdue ?? 0),
      unassigned: Number(summary?.unassigned ?? 0),
    },
    byStatus: byStatus.map((item) => ({
      id: Number(item.id),
      name: item.name,
      count: Number(item.count),
      tone: item.tone as StatusTone,
      closesRequest: item.closesRequest,
    })),
    byPriority: byPriority.map((item): DashboardPriorityMetric => ({
      id: item.id === null ? null : Number(item.id),
      label: item.label as RequestPriority | "Não priorizada",
      count: Number(item.count),
    })),
    byCategory: byCategory.map((item) => ({
      id: Number(item.id),
      name: item.name,
      count: Number(item.count),
    })),
    openedOverTime: openedOverTime.map((item) => ({
      period: item.period,
      count: Number(item.count),
    })),
  };
}
