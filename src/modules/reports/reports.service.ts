import type {
  DashboardPriorityMetric,
  DashboardQuery,
  DashboardResponse,
} from "../DTOs/reports/Dashboard.dto.ts";
import type { QueueCsvExport, QueueExportRow } from "../DTOs/reports/QueueExport.dto.ts";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";
import type { RequestPriority } from "../../shared/types/requests.ts";
import type { StatusTone } from "../../shared/types/systemTheme.ts";
import * as repository from "./reports.repository.ts";

const BUSINESS_TIME_ZONE = "America/Sao_Paulo";
const CSV_HEADERS = [
  "Protocolo",
  "Data de Abertura",
  "Área",
  "Processo",
  "Categoria",
  "Status",
  "Prioridade",
  "Responsável",
  "Data de Mapeamento",
  "Data da Última Atualização",
  "Resultado da Triagem",
  "Data de Conclusão",
] as const;

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const filenameDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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

function formatDateTime(value: string | Date | null): string {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormatter.format(date).replace(",", "");
}

function triageResultFromInternalNotes(raw: string | null): string {
  if (!raw) return "";

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return "";

    const record = parsed as Record<string, unknown>;
    const assessment =
      typeof record.__triage === "object" && record.__triage !== null
        ? (record.__triage as Record<string, unknown>)
        : record;

    return typeof assessment.result === "string" ? assessment.result : "";
  } catch {
    return "";
  }
}

/** Neutraliza fórmulas de planilha e aplica escaping RFC 4180 com `;`. */
function csvField(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const protectedValue = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}

function rowToCsv(row: QueueExportRow): string {
  return [
    row.protocol,
    formatDateTime(row.createdAt),
    row.area,
    row.processName,
    row.category,
    row.status,
    row.priority,
    row.assignee,
    formatDateTime(row.mappingScheduledFor),
    formatDateTime(row.updatedAt),
    triageResultFromInternalNotes(row.internalNotes),
    formatDateTime(row.completedAt),
  ]
    .map(csvField)
    .join(";");
}

export async function exportQueueCsv(filters: QueueFilterQuery): Promise<QueueCsvExport> {
  const rows = await repository.fetchQueueExportRows(filters);
  const lines = [CSV_HEADERS.map(csvField).join(";"), ...rows.map(rowToCsv)];

  return {
    // BOM garante que Excel reconheça os acentos como UTF-8.
    content: `\uFEFF${lines.join("\r\n")}\r\n`,
    filename: `solicitacoes-${filenameDateFormatter.format(new Date())}.csv`,
  };
}
