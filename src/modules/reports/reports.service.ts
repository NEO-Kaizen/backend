import type {
  DashboardPriorityMetric,
  DashboardQuery,
  DashboardResponse,
} from "../DTOs/reports/Dashboard.dto.ts";
import PDFDocument from "pdfkit";
import type { RequestPdfExport } from "../DTOs/reports/RequestPdfExport.dto.ts";
import type { QueueCsvExport, QueueExportRow } from "../DTOs/reports/QueueExport.dto.ts";
import type { RequestInternalDetailDTO } from "../DTOs/requests/RequestInternalDetail.dto.ts";
import type {
  PublicOperationalImpacts,
  PublicRequestDetails,
  RequesterRequestDetails,
  TrackingDetailsResponse,
} from "../DTOs/requests/RequestTracking.dto.ts";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";
import type { RequestPriority, YesNoDetail } from "../../shared/types/requests.ts";
import type { StatusTone } from "../../shared/types/systemTheme.ts";
import { findInternalByProtocol, getTracking } from "../requests/requests.service.ts";
import type { TrackingCaller } from "../requests/requests.service.ts";
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

const PDF_MARGIN = 48;
const PDF_BOTTOM_MARGIN = 60;
const PDF_HEADING_COLOR = "#1f3a5f";
const PDF_LABEL_COLOR = "#44546a";
const PDF_RULE_COLOR = "#c9d4e3";
const PDF_TEXT_COLOR = "#111111";

interface PdfAttachment {
  fileName: string;
}

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "";

  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatYesNoDetail(value: YesNoDetail | undefined): string {
  if (value === undefined) return "";
  if (value === false) return "Não";
  return value ? `Sim — ${value}` : "Sim";
}

function formatScore(detail: RequestInternalDetailDTO): string {
  const { score, maxScore, label } = detail.prioritization;
  if (score === null) return "Não avaliada";
  return `${score.toFixed(1)} / ${maxScore}${label ? ` — ${label}` : ""}`;
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  if (doc.y + 48 > doc.page.height - doc.page.margins.bottom) doc.addPage();
  doc.moveDown(0.45);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_HEADING_COLOR).text(title.toUpperCase());

  const lineY = doc.y + 2;
  doc
    .moveTo(doc.page.margins.left, lineY)
    .lineTo(doc.page.width - doc.page.margins.right, lineY)
    .strokeColor(PDF_RULE_COLOR)
    .lineWidth(0.8)
    .stroke();
  doc.y = lineY + 6;
}

function addField(doc: PDFKit.PDFDocument, label: string, value: string): void {
  if (!value) return;

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(PDF_LABEL_COLOR)
    .text(`${label}: `, { continued: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(PDF_TEXT_COLOR).text(value);
  doc.moveDown(0.12);
}

function addBullet(doc: PDFKit.PDFDocument, value: string): void {
  doc.font("Helvetica").fontSize(9.5).fillColor(PDF_TEXT_COLOR).text(`• ${value}`, { indent: 8 });
}

function renderHeader(doc: PDFKit.PDFDocument, protocol: string, title: string): void {
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(PDF_LABEL_COLOR)
    .text("Portal MAAT | Relatório de solicitação");
  doc.moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(PDF_HEADING_COLOR)
    .text(title || "Relatório de solicitação");
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(PDF_LABEL_COLOR)
    .text(`Protocolo ${protocol}`)
    .text(`Gerado em ${formatDateTime(new Date())}`);
}

function renderPageMargins(doc: PDFKit.PDFDocument, protocol: string): void {
  const range = doc.bufferedPageRange();
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex++) {
    doc.switchToPage(pageIndex);
    if (pageIndex > range.start) {
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(PDF_HEADING_COLOR)
        .text(`Relatório de solicitação — ${protocol}`, doc.page.margins.left, 24, {
          lineBreak: false,
        });
    }

    const footer = `Portal MAAT — página ${pageIndex + 1} de ${range.count}`;
    doc.font("Helvetica").fontSize(8).fillColor(PDF_LABEL_COLOR);
    // Uma largura explícita ativa a paginação automática do PDFKit no rodapé.
    const footerX = doc.page.margins.left + (contentWidth - doc.widthOfString(footer)) / 2;
    doc.text(footer, footerX, doc.page.height - 32, { lineBreak: false });
  }
}

function buildPdf(
  protocol: string,
  title: string,
  render: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PDF_MARGIN,
        bottom: PDF_BOTTOM_MARGIN,
        left: PDF_MARGIN,
        right: PDF_MARGIN,
      },
      bufferPages: true,
      info: {
        Title: `Solicitação ${protocol}`,
        Author: "Portal MAAT",
        Subject: "Relatório de solicitação",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      renderHeader(doc, protocol, title);
      render(doc);
      renderPageMargins(doc, protocol);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function renderInternalIdentification(
  doc: PDFKit.PDFDocument,
  detail: RequestInternalDetailDTO,
): void {
  addSectionTitle(doc, "Identificação");
  addField(doc, "Status", detail.status);
  addField(doc, "Prioridade", detail.priority ?? "Não priorizada");
  addField(doc, "Score", formatScore(detail));
  addField(doc, "Categoria", detail.demand.category);
  addField(doc, "Tipo de solicitação", detail.demand.requestType);
  addField(doc, "Aberta em", formatDateTime(detail.openedAt));
  addField(doc, "Última atualização", formatDateTime(detail.lastUpdate));
  addField(doc, "Prazo desejado", formatDateOnly(detail.operational.desiredDeadline));
  addField(doc, "Data de mapeamento", formatDateOnly(detail.mappingDate));
  addField(
    doc,
    "Reunião",
    detail.meeting
      ? `${formatDateTime(detail.meeting.scheduledFor)}${detail.meeting.link ? ` — ${detail.meeting.link}` : ""}`
      : "",
  );
}

function renderInternalRequester(doc: PDFKit.PDFDocument, detail: RequestInternalDetailDTO): void {
  addSectionTitle(doc, "Solicitante");
  addField(doc, "Nome", detail.requester.fullName);
  addField(doc, "E-mail", detail.requester.corporateEmail);
  addField(doc, "Área", detail.requester.area);
  addField(doc, "Departamento", detail.requester.department ?? "");
  addField(doc, "Gestor", detail.requester.manager);
  addField(doc, "Contato adicional", detail.requester.additionalContact ?? "");
}

function renderInternalDemand(doc: PDFKit.PDFDocument, detail: RequestInternalDetailDTO): void {
  addSectionTitle(doc, "Demanda");
  addField(doc, "Processo", detail.demand.processName);
  addField(doc, "Descrição da necessidade", detail.demand.description);
  addField(doc, "Problema ou oportunidade", detail.demand.problem);
  addField(doc, "Resultado esperado", detail.demand.expectedResult);
  addField(doc, "Justificativa", detail.demand.justification);
}

function renderInternalOperational(
  doc: PDFKit.PDFDocument,
  detail: RequestInternalDetailDTO,
): void {
  addSectionTitle(doc, "Operação");
  addField(doc, "Descrição do processo", detail.operational.processDescription);
  addField(doc, "Etapas do processo", detail.operational.processSteps);
  addField(doc, "Sistemas utilizados", detail.operational.systemsUsed);
  addField(doc, "Frequência de execução", detail.operational.executionFrequency);
  addField(doc, "Volumetria", detail.operational.volumetry);
  addField(doc, "Pessoas envolvidas", String(detail.operational.peopleInvolved));
  addField(doc, "Tempo médio de execução", detail.operational.averageExecutionTime);
  addField(
    doc,
    "Esforço mensal",
    Number.isFinite(detail.operational.monthlyEffortHours)
      ? `${detail.operational.monthlyEffortHours} h`
      : "",
  );
  addField(doc, "Controles manuais", formatYesNoDetail(detail.operational.hasManualControls));
  addField(doc, "Principais riscos", detail.operational.mainRisks);
  addField(doc, "Impacto no cliente", detail.operational.clientImpact);
  addField(doc, "Impacto operacional", detail.operational.operationalImpact);
  addField(doc, "Criticidade percebida", detail.operational.perceivedCriticality);
}

function renderInternalComplementary(
  doc: PDFKit.PDFDocument,
  detail: RequestInternalDetailDTO,
): void {
  const complementary = detail.complementary;
  if (!complementary) return;

  addSectionTitle(doc, "Complementar");
  addField(
    doc,
    "Documentação do processo",
    formatYesNoDetail(complementary.hasProcessDocumentation),
  );
  addField(doc, "Solução semelhante", formatYesNoDetail(complementary.hasSimilarSolution));
  addField(doc, "Depende de outras áreas", formatYesNoDetail(complementary.dependsOnOtherAreas));
  addField(doc, "Informações restritas", formatYesNoDetail(complementary.handlesRestrictedInfo));
  addField(doc, "Observações adicionais", complementary.additionalNotes ?? "");
}

function renderInternalAssignees(doc: PDFKit.PDFDocument, detail: RequestInternalDetailDTO): void {
  addSectionTitle(doc, "Responsáveis");
  addField(
    doc,
    "Triagem",
    detail.assignee
      ? `${detail.assignee.name}${detail.assignee.email ? ` — ${detail.assignee.email}` : ""}`
      : "Não atribuído",
  );
  addField(
    doc,
    "Mapeamento",
    detail.mappingAssignee
      ? `${detail.mappingAssignee.name}${detail.mappingAssignee.email ? ` — ${detail.mappingAssignee.email}` : ""}`
      : "Não atribuído",
  );
}

function renderSchedulePreferences(doc: PDFKit.PDFDocument, preferences: string[] | null): void {
  if (!preferences || preferences.length === 0) return;

  addSectionTitle(doc, "Preferências de horário");
  for (const preference of preferences) {
    addBullet(doc, preference);
  }
}

function renderAttachments(doc: PDFKit.PDFDocument, attachments: readonly PdfAttachment[]): void {
  addSectionTitle(doc, "Anexos");

  if (attachments.length === 0) {
    doc.font("Helvetica").fontSize(9.5).fillColor(PDF_TEXT_COLOR).text("Nenhum anexo.");
    return;
  }

  for (const attachment of attachments) {
    addBullet(doc, attachment.fileName);
  }
}

function renderInternalObservations(
  doc: PDFKit.PDFDocument,
  detail: RequestInternalDetailDTO,
): void {
  if (!detail.internalObservations) return;

  addSectionTitle(doc, "Observações internas");
  doc.font("Helvetica").fontSize(9.5).fillColor(PDF_TEXT_COLOR).text(detail.internalObservations);
}

function renderInternalRequestPdf(detail: RequestInternalDetailDTO): Promise<Buffer> {
  return buildPdf(detail.protocol, detail.demand.title, (doc) => {
    renderInternalIdentification(doc, detail);
    renderInternalRequester(doc, detail);
    renderInternalDemand(doc, detail);
    renderInternalOperational(doc, detail);
    renderInternalComplementary(doc, detail);
    renderInternalAssignees(doc, detail);
    renderSchedulePreferences(doc, detail.schedulePreferences);
    renderAttachments(doc, detail.attachments);
    renderInternalObservations(doc, detail);
  });
}

function renderTrackingCommonSections(
  doc: PDFKit.PDFDocument,
  details: PublicRequestDetails | RequesterRequestDetails,
): void {
  addSectionTitle(doc, "Identificação");
  addField(doc, "Status", details.status);
  addField(doc, "Aberta em", formatDateTime(details.openedAt));
  addField(doc, "Última atualização", formatDateTime(details.lastUpdate));
  addField(
    doc,
    "Reunião",
    details.meeting
      ? `${formatDateTime(details.meeting.scheduledFor)}${details.meeting.link ? ` — ${details.meeting.link}` : ""}`
      : "",
  );
  addField(doc, "Última mensagem técnica", details.lastTechnicalMessage ?? "");

  addSectionTitle(doc, "Solicitante");
  addField(doc, "Nome", details.requester.fullName);
  addField(doc, "E-mail", details.requester.corporateEmail);
  addField(doc, "Área", details.requester.area);
  addField(doc, "Departamento", details.requester.department ?? "");
  addField(doc, "Gestor", details.requester.manager);
  addField(doc, "Contato adicional", details.requester.additionalContact ?? "");

  addSectionTitle(doc, "Demanda");
  addField(doc, "Tipo de solicitação", details.demand.requestType);
  addField(doc, "Categoria", details.demand.category);
  addField(doc, "Processo", details.demand.processName);
  addField(doc, "Descrição da necessidade", details.demand.description);
  addField(doc, "Problema ou oportunidade", details.demand.problem);
  addField(doc, "Resultado esperado", details.demand.expectedResult);
  addField(doc, "Justificativa", details.demand.justification);
}

function renderPublicImpacts(doc: PDFKit.PDFDocument, impacts: PublicOperationalImpacts): void {
  addSectionTitle(doc, "Impactos");
  addField(doc, "Principais riscos", impacts.mainRisks);
  addField(doc, "Impacto no cliente", impacts.clientImpact);
  addField(doc, "Impacto operacional", impacts.operationalImpact);
  addField(doc, "Criticidade percebida", impacts.perceivedCriticality);
  addField(doc, "Prazo desejado", formatDateOnly(impacts.desiredDeadline));
}

function renderTrackingPublicSections(
  doc: PDFKit.PDFDocument,
  details: PublicRequestDetails,
): void {
  renderTrackingCommonSections(doc, details);
  renderPublicImpacts(doc, details.impacts);
}

function renderTrackingAuthenticatedSections(
  doc: PDFKit.PDFDocument,
  details: RequesterRequestDetails,
): void {
  renderTrackingCommonSections(doc, details);
  renderPublicImpacts(doc, details.operational);

  addSectionTitle(doc, "Operação");
  addField(doc, "Descrição do processo", details.operational.processDescription);
  addField(doc, "Etapas do processo", details.operational.processSteps);
  addField(doc, "Sistemas utilizados", details.operational.systemsUsed);
  addField(doc, "Frequência de execução", details.operational.executionFrequency);
  addField(doc, "Volumetria", details.operational.volumetry);
  addField(doc, "Pessoas envolvidas", String(details.operational.peopleInvolved));
  addField(doc, "Tempo médio de execução", details.operational.averageExecutionTime);
  addField(
    doc,
    "Esforço mensal",
    Number.isFinite(details.operational.monthlyEffortHours)
      ? `${details.operational.monthlyEffortHours} h`
      : "",
  );
  addField(doc, "Controles manuais", formatYesNoDetail(details.operational.hasManualControls));

  const complementary = details.complementary;
  if (complementary) {
    addSectionTitle(doc, "Complementar");
    addField(
      doc,
      "Documentação do processo",
      formatYesNoDetail(complementary.hasProcessDocumentation),
    );
    addField(doc, "Solução semelhante", formatYesNoDetail(complementary.hasSimilarSolution));
    addField(doc, "Depende de outras áreas", formatYesNoDetail(complementary.dependsOnOtherAreas));
    addField(doc, "Informações restritas", formatYesNoDetail(complementary.handlesRestrictedInfo));
    addField(doc, "Observações adicionais", complementary.additionalNotes ?? "");
  }

  renderSchedulePreferences(doc, details.schedulePreferences);
  renderAttachments(doc, details.attachments);
}

function renderRequesterRequestPdf(tracking: TrackingDetailsResponse): Promise<Buffer> {
  return buildPdf(tracking.details.protocol, tracking.details.demand.title, (doc) => {
    if (tracking.mode === "authenticated") {
      renderTrackingAuthenticatedSections(doc, tracking.details);
    } else {
      renderTrackingPublicSections(doc, tracking.details);
    }
  });
}

export async function getGenerateRequestPDF(request: RequestPdfExport): Promise<Buffer> {
  const detail = await findInternalByProtocol(request.protocol);
  return renderInternalRequestPdf(detail);
}

/**
 * PDF do solicitante: reaproveita `getTracking`, que valida ownership e devolve
 * somente o recorte permitido (público ou do dono autenticado). O histórico de
 * auditoria não entra neste PDF.
 */
export async function getRequesterRequestPDF(
  protocol: string,
  caller: TrackingCaller,
): Promise<Buffer> {
  const tracking = await getTracking(protocol, caller);
  return renderRequesterRequestPdf(tracking);
}

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
