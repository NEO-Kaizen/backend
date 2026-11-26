import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { isPublicationStatus, type PublicationStatus } from "../../shared/types/duplicates.ts";
import {
  COMPLETED_REQUEST_REDACTION_VERSION,
  COMPLETED_TEMPLATE_SUMMARY_MIDDLE,
  COMPLETED_TEMPLATE_SUMMARY_PREFIX,
  COMPLETED_TEMPLATE_SUMMARY_SUFFIX,
  COMPLETED_TEMPLATE_TITLE_PREFIX,
  COMPLETED_TEMPLATE_TITLE_SUFFIX,
} from "./template.ts";

/**
 * Leitura da projeção pública e da flag de duplicidade (issue #209).
 *
 * A busca e o índice NUNCA consultam `requests`: este repository só conhece
 * `request_public_projections` e `system_settings`.
 */
export interface PublicProjectionRow {
  request_id: string;
  public_id: string;
  public_title: string;
  public_summary: string;
  public_category: string;
  public_status: string;
  public_period: string;
  publication_status: PublicationStatus;
  is_publicly_listable: boolean;
  redaction_version: string;
  version: number;
  public_concluded_at: Date | null;
  updated_at: Date;
}

const PROJECTION_COLUMNS = [
  "request_id",
  "public_id",
  "public_title",
  "public_summary",
  "public_category",
  "public_status",
  "public_period",
  "publication_status",
  "is_publicly_listable",
  "redaction_version",
  "version",
  "public_concluded_at",
  "updated_at",
] as const;

/** Janela padrão do corpus de concluídas, em meses (issue #210). */
export const DEFAULT_DUPLICATE_COMPLETED_WINDOW_MONTHS = 3;
const MIN_DUPLICATE_COMPLETED_WINDOW_MONTHS = 1;
const MAX_DUPLICATE_COMPLETED_WINDOW_MONTHS = 36;

/** Filtro único de publicação; espelha `isPublishedProjection`. */
export const PUBLISHED_PROJECTION_FILTER = {
  publication_status: "published",
  is_publicly_listable: true,
} as const satisfies Partial<PublicProjectionRow>;

export function isPublishedProjection(
  projection: Pick<PublicProjectionRow, "publication_status" | "is_publicly_listable">,
): boolean {
  return (
    projection.publication_status === PUBLISHED_PROJECTION_FILTER.publication_status &&
    projection.is_publicly_listable === PUBLISHED_PROJECTION_FILTER.is_publicly_listable
  );
}

/**
 * Valida a linha vinda do driver antes de expô-la ao resto da aplicação.
 * As colunas são selecionadas explicitamente em `PROJECTION_COLUMNS`; o parse
 * garante que o contrato interno não dependa de cast silencioso.
 */
function parsePublicProjectionRow(row: Record<string, unknown>): PublicProjectionRow {
  const {
    request_id,
    public_id,
    public_title,
    public_summary,
    public_category,
    public_status,
    public_period,
    publication_status,
    is_publicly_listable,
    redaction_version,
    version,
    public_concluded_at,
    updated_at,
  } = row;

  if (
    typeof request_id !== "string" ||
    typeof public_id !== "string" ||
    typeof public_title !== "string" ||
    typeof public_summary !== "string" ||
    typeof public_category !== "string" ||
    typeof public_status !== "string" ||
    typeof public_period !== "string" ||
    !isPublicationStatus(publication_status) ||
    typeof is_publicly_listable !== "boolean" ||
    typeof redaction_version !== "string" ||
    typeof version !== "number" ||
    !(public_concluded_at === null || public_concluded_at instanceof Date) ||
    !(updated_at instanceof Date)
  ) {
    throw new Error("Linha inválida em request_public_projections.");
  }

  return {
    request_id,
    public_id,
    public_title,
    public_summary,
    public_category,
    public_status,
    public_period,
    publication_status,
    is_publicly_listable,
    redaction_version,
    version,
    public_concluded_at,
    updated_at,
  };
}

/** Flag nasce desligada; ausência do singleton é tratada como desligada. */
export async function isDuplicateDetectionEnabled(trx?: Knex.Transaction): Promise<boolean> {
  const source = trx ?? db;
  const row: { duplicate_detection_enabled: boolean } | undefined = await source("system_settings")
    .where({ settings_id: 1 })
    .first("duplicate_detection_enabled");

  return row?.duplicate_detection_enabled === true;
}

/**
 * Janela do corpus de concluídas em meses. O banco garante 1..36; a ausência do
 * singleton cai para o padrão 3.
 */
export async function getDuplicateCompletedWindowMonths(trx?: Knex.Transaction): Promise<number> {
  const source = trx ?? db;
  const row: Record<string, unknown> | undefined = await source("system_settings")
    .where({ settings_id: 1 })
    .first("duplicate_completed_window_months");

  const windowMonths = row?.duplicate_completed_window_months;
  return typeof windowMonths === "number" &&
    Number.isInteger(windowMonths) &&
    windowMonths >= MIN_DUPLICATE_COMPLETED_WINDOW_MONTHS &&
    windowMonths <= MAX_DUPLICATE_COMPLETED_WINDOW_MONTHS
    ? windowMonths
    : DEFAULT_DUPLICATE_COMPLETED_WINDOW_MONTHS;
}

/**
 * Somente projeções publicadas e listáveis entram no índice. Concluídas ainda
 * são filtradas pela janela: a varredura marca `suppressed`, mas o filtro
 * protege contra defasagem entre a mudança da janela e o próximo poll/rebuild.
 */
export async function listPublishedProjections(
  trx?: Knex.Transaction,
): Promise<PublicProjectionRow[]> {
  const source = trx ?? db;
  const windowMonths = await getDuplicateCompletedWindowMonths(trx);

  const rows: Record<string, unknown>[] = await source("request_public_projections")
    .where(PUBLISHED_PROJECTION_FILTER)
    .andWhere((builder) => {
      builder
        .whereNull("public_concluded_at")
        .orWhereRaw("public_concluded_at >= now() - make_interval(months => ?)", [windowMonths]);
    })
    .orderBy("updated_at", "asc")
    .select(...PROJECTION_COLUMNS);

  return rows.map(parsePublicProjectionRow);
}

/**
 * Varredura da janela (issue #210): concluídas publicadas e listáveis fora da
 * janela viram `suppressed`/`outside_window`. O texto livre é substituído pelo
 * template de concluída na mesma escrita, para que uma linha suprimida nunca
 * preserve texto que deixou de ser publicável.
 *
 * O relógio é o do banco (`now()`), o mesmo usado na publicação.
 */
export async function suppressCompletedOutsideWindow(
  windowMonths: number,
  trx?: Knex.Transaction,
): Promise<number> {
  const source = trx ?? db;

  return source("request_public_projections")
    .where(PUBLISHED_PROJECTION_FILTER)
    .whereNotNull("public_concluded_at")
    .whereRaw("public_concluded_at < now() - make_interval(months => ?)", [windowMonths])
    .update({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
      suppressed_at: source.fn.now(),
      public_title: source.raw("? || public_category || ?", [
        COMPLETED_TEMPLATE_TITLE_PREFIX,
        COMPLETED_TEMPLATE_TITLE_SUFFIX,
      ]),
      public_summary: source.raw("? || public_category || ? || public_period || ?", [
        COMPLETED_TEMPLATE_SUMMARY_PREFIX,
        COMPLETED_TEMPLATE_SUMMARY_MIDDLE,
        COMPLETED_TEMPLATE_SUMMARY_SUFFIX,
      ]),
      redaction_version: COMPLETED_REQUEST_REDACTION_VERSION,
      version: source.raw("version + 1"),
      updated_at: source.fn.now(),
    });
}

/**
 * Candidatas à reconciliação no sentido inverso: linhas suprimidas por
 * `outside_window` cuja conclusão voltou a ficar dentro da janela atual.
 * A decisão de republicar é refeita por `publishRequestProjection`, que relê
 * `requests` e reavalia todas as regras.
 */
export async function listSuppressedCompletedWithinWindow(
  windowMonths: number,
  trx?: Knex.Transaction,
): Promise<string[]> {
  const source = trx ?? db;
  const rows: Record<string, unknown>[] = await source("request_public_projections")
    .where({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
    })
    .whereNotNull("public_concluded_at")
    .whereRaw("public_concluded_at >= now() - make_interval(months => ?)", [windowMonths])
    .orderBy("updated_at", "asc")
    .select("request_id");

  return rows.map((row) => {
    const { request_id } = row;
    if (typeof request_id !== "string") {
      throw new Error("Linha inválida em request_public_projections.");
    }
    return request_id;
  });
}

/**
 * Mudanças desde `since`, incluindo linhas suprimidas ou não listáveis para
 * que o poller saiba remover do índice o que deixou de ser publicado. O
 * chamador aplica a sobreposição de `updated_at`.
 */
export async function listProjectionChangesSince(
  since: Date,
  trx?: Knex.Transaction,
): Promise<PublicProjectionRow[]> {
  const source = trx ?? db;

  const rows: Record<string, unknown>[] = await source("request_public_projections")
    .where("updated_at", ">=", since)
    .orderBy("updated_at", "asc")
    .select(...PROJECTION_COLUMNS);

  return rows.map(parsePublicProjectionRow);
}
