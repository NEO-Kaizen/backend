import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import {
  isPublicationStatus,
  type PublicationStatus,
  type SuppressionReason,
} from "../../shared/types/duplicates.ts";
import { isCompletedStatus } from "../../shared/types/status.ts";
import { getDuplicateCompletedWindowMonths } from "./duplicates.repository.ts";
import { buildCompletedProjectionText } from "./redact.ts";
import {
  buildCompletedRequestTemplate,
  buildOpenRequestTemplate,
  COMPLETED_REQUEST_PUBLIC_STATUS,
  type PublicRequestTemplate,
} from "./template.ts";

/**
 * Publicação/supressão da projeção pública de uma Solicitação (issue #209;
 * concluídas na issue #210).
 *
 * A linha é sempre criada ou atualizada — publicada ou suprimida — dentro da
 * transação que alterou a Solicitação. A busca nunca lê `requests`; este
 * módulo é o único que monta o snapshot público a partir da base interna.
 *
 * Regras em `docs/rules/duplicate-detection.md`.
 */
interface ProjectionSourceRow {
  request_id: string;
  created_at: Date;
  title: string;
  need_description: string;
  problem_opportunity: string;
  concluded_at: Date | null;
  is_within_window: boolean;
  handles_restricted_info: boolean | null;
  category_name: string;
  category_is_publicly_listable: boolean;
  status_id: number;
  status_is_active: boolean;
  status_is_terminal: boolean;
  status_is_restricted: boolean;
  status_is_duplicate_corpus_eligible: boolean;
}

interface ExistingProjection {
  public_id: string;
  publication_status: PublicationStatus;
  published_at: Date | null;
  suppressed_at: Date | null;
}

interface ProjectionValues {
  public_id: string;
  public_title: string;
  public_summary: string;
  public_category: string;
  public_status: string;
  public_period: string;
  publication_status: PublicationStatus;
  is_publicly_listable: boolean;
  redaction_version: string;
  public_concluded_at: Date | null;
  published_at: Date | null;
  suppressed_at: Date | null;
  suppression_reason: SuppressionReason | null;
}

/** Sinais de elegibilidade usados pela precedência de supressão. */
export interface SuppressionSignals {
  statusIsActive: boolean;
  statusIsTerminal: boolean;
  statusIsCompleted: boolean;
  handlesRestrictedInfo: boolean | null;
  statusIsRestricted: boolean;
  hasConcludedAt: boolean;
  concludedAtIsWithinWindow: boolean;
  categoryIsPubliclyListable: boolean;
  statusIsCorpusEligible: boolean;
}

function toSuppressionSignals(source: ProjectionSourceRow): SuppressionSignals {
  return {
    statusIsActive: source.status_is_active,
    statusIsTerminal: source.status_is_terminal,
    statusIsCompleted: isCompletedStatus(source.status_id),
    handlesRestrictedInfo: source.handles_restricted_info,
    statusIsRestricted: source.status_is_restricted,
    hasConcludedAt: source.concluded_at !== null,
    concludedAtIsWithinWindow: source.is_within_window,
    categoryIsPubliclyListable: source.category_is_publicly_listable,
    statusIsCorpusEligible: source.status_is_duplicate_corpus_eligible,
  };
}

/**
 * Precedência determinística dos motivos de supressão.
 *
 * O Status 16 é terminal, mas não cai em `terminal_status`: ele entra no
 * corpus de concluídas desde que tenha `concluded_at` e esteja na janela.
 */
export function resolveSuppressionReason(input: SuppressionSignals): SuppressionReason | null {
  if (!input.statusIsActive) return "inactive_status";
  if (input.statusIsTerminal && !input.statusIsCompleted) return "terminal_status";
  if (input.handlesRestrictedInfo === true) return "restricted_request";
  if (input.statusIsRestricted) return "restricted_status";
  if (input.statusIsCompleted) {
    if (!input.hasConcludedAt) return "missing_concluded_at";
    if (!input.concludedAtIsWithinWindow) return "outside_window";
  }
  if (!input.categoryIsPubliclyListable) return "ineligible_category";
  if (!input.statusIsCorpusEligible) return "ineligible_status";
  return null;
}

function isNullableDate(value: unknown): value is Date | null {
  return value === null || value instanceof Date;
}

/**
 * Valida a linha da base interna antes de montar o snapshot público. A coluna
 * `is_within_window` vem calculada pelo PostgreSQL com o relógio do banco.
 */
function parseProjectionSourceRow(row: Record<string, unknown>): ProjectionSourceRow {
  const {
    request_id,
    created_at,
    title,
    need_description,
    problem_opportunity,
    concluded_at,
    is_within_window,
    handles_restricted_info,
    category_name,
    category_is_publicly_listable,
    status_id,
    status_is_active,
    status_is_terminal,
    status_is_restricted,
    status_is_duplicate_corpus_eligible,
  } = row;

  if (
    typeof request_id !== "string" ||
    !(created_at instanceof Date) ||
    typeof title !== "string" ||
    typeof need_description !== "string" ||
    typeof problem_opportunity !== "string" ||
    !isNullableDate(concluded_at) ||
    typeof is_within_window !== "boolean" ||
    !(handles_restricted_info === null || typeof handles_restricted_info === "boolean") ||
    typeof category_name !== "string" ||
    typeof category_is_publicly_listable !== "boolean" ||
    typeof status_id !== "number" ||
    typeof status_is_active !== "boolean" ||
    typeof status_is_terminal !== "boolean" ||
    typeof status_is_restricted !== "boolean" ||
    typeof status_is_duplicate_corpus_eligible !== "boolean"
  ) {
    throw new Error("Linha inválida em requests para a projeção pública.");
  }

  return {
    request_id,
    created_at,
    title,
    need_description,
    problem_opportunity,
    concluded_at,
    is_within_window,
    handles_restricted_info,
    category_name,
    category_is_publicly_listable,
    status_id,
    status_is_active,
    status_is_terminal,
    status_is_restricted,
    status_is_duplicate_corpus_eligible,
  };
}

function parseExistingProjection(row: Record<string, unknown>): ExistingProjection {
  const { public_id, publication_status, published_at, suppressed_at } = row;

  if (
    typeof public_id !== "string" ||
    !isPublicationStatus(publication_status) ||
    !isNullableDate(published_at) ||
    !isNullableDate(suppressed_at)
  ) {
    throw new Error("Linha inválida em request_public_projections.");
  }

  return { public_id, publication_status, published_at, suppressed_at };
}

async function findProjectionSource(
  trx: Knex.Transaction,
  requestId: string,
  windowMonths: number,
): Promise<ProjectionSourceRow | undefined> {
  const rows: Record<string, unknown>[] = await trx("requests as r")
    .join("categories as c", "c.category_id", "r.category_id")
    .join("statuses as s", "s.status_id", "r.status_id")
    .where("r.request_id", requestId)
    .select({
      request_id: "r.request_id",
      created_at: "r.created_at",
      title: "r.title",
      need_description: "r.need_description",
      problem_opportunity: "r.problem_opportunity",
      concluded_at: "r.concluded_at",
      handles_restricted_info: "r.handles_restricted_info",
      category_name: "c.name",
      category_is_publicly_listable: "c.is_publicly_listable",
      status_id: "s.status_id",
      status_is_active: "s.is_active",
      status_is_terminal: "s.is_terminal",
      status_is_restricted: "s.is_restricted",
      status_is_duplicate_corpus_eligible: "s.is_duplicate_corpus_eligible",
    })
    .select(
      trx.raw(
        "(r.concluded_at IS NOT NULL AND r.concluded_at >= now() - make_interval(months => ?)) as is_within_window",
        [windowMonths],
      ),
    )
    .limit(1);

  const row = rows[0];
  return row ? parseProjectionSourceRow(row) : undefined;
}

/**
 * Texto público da projeção. Aberta usa o template sem texto livre. Concluída
 * usa título + descrição/problema com o gate de PII; qualquer supressão usa o
 * template de concluída — a linha suprimida nunca guarda texto livre.
 */
function buildProjectionTemplate(
  source: ProjectionSourceRow,
  suppressionReason: SuppressionReason | null,
): PublicRequestTemplate {
  const isCompleted = isCompletedStatus(source.status_id);

  if (!isCompleted) {
    return buildOpenRequestTemplate({
      category: source.category_name,
      createdAt: source.created_at,
    });
  }

  const fallback = buildCompletedRequestTemplate({
    category: source.category_name,
    createdAt: source.created_at,
  });

  if (suppressionReason) {
    return fallback;
  }

  const redacted = buildCompletedProjectionText({
    title: source.title,
    description: source.need_description,
    problem: source.problem_opportunity,
    category: source.category_name,
    createdAt: source.created_at,
  });

  return {
    title: redacted.title,
    summary: redacted.summary,
    category: source.category_name,
    status: COMPLETED_REQUEST_PUBLIC_STATUS,
    period: fallback.period,
    redactionVersion: redacted.redactionVersion,
  };
}

/**
 * Cria ou atualiza a projeção de uma Solicitação. Deve rodar na MESMA
 * transação da criação, edição, transição de Status ou desfecho da Triagem.
 */
export async function publishRequestProjection(
  trx: Knex.Transaction,
  requestId: string,
): Promise<void> {
  const windowMonths = await getDuplicateCompletedWindowMonths(trx);
  const source = await findProjectionSource(trx, requestId, windowMonths);

  // Solicitação removida fisicamente: não há o que projetar.
  if (!source) return;

  const suppressionReason = resolveSuppressionReason(toSuppressionSignals(source));
  const template = buildProjectionTemplate(source, suppressionReason);

  const isPubliclyListable =
    source.category_is_publicly_listable && source.status_is_duplicate_corpus_eligible;

  const publicationStatus: PublicationStatus = suppressionReason ? "suppressed" : "published";
  const existingRow: Record<string, unknown> | undefined = await trx("request_public_projections")
    .where({ request_id: requestId })
    .forUpdate()
    .first("public_id", "publication_status", "published_at", "suppressed_at");
  const existing = existingRow ? parseExistingProjection(existingRow) : undefined;

  const now = new Date();
  const publishedAt =
    publicationStatus === "published"
      ? (existing?.published_at ?? now)
      : (existing?.published_at ?? null);
  const suppressedAt =
    publicationStatus === "suppressed"
      ? existing?.publication_status === "suppressed"
        ? (existing.suppressed_at ?? now)
        : now
      : null;

  const values: ProjectionValues = {
    public_id: existing?.public_id ?? randomUUID(),
    public_title: template.title,
    public_summary: template.summary,
    public_category: template.category,
    public_status: template.status,
    public_period: template.period,
    publication_status: publicationStatus,
    is_publicly_listable: isPubliclyListable,
    redaction_version: template.redactionVersion,
    public_concluded_at: source.concluded_at,
    published_at: publishedAt,
    suppressed_at: suppressedAt,
    suppression_reason: suppressionReason,
  };

  if (!existing) {
    // `created_at` e `updated_at` usam o relógio do banco (default da migration),
    // que é o mesmo relógio lido pelo cursor do poll.
    await trx("request_public_projections").insert({
      request_id: requestId,
      ...values,
      version: 1,
    });
    return;
  }

  await trx("request_public_projections")
    .where({ request_id: requestId })
    .update({
      ...values,
      version: trx.raw("version + 1"),
      updated_at: trx.fn.now(),
    });
}
