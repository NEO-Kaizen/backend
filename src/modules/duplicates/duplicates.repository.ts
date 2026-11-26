import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { PublicationStatus } from "../../shared/types/duplicates.ts";

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
  "updated_at",
] as const;

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

function isPublicationStatus(value: unknown): value is PublicationStatus {
  return value === "published" || value === "suppressed";
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

export async function listPublishedProjections(
  trx?: Knex.Transaction,
): Promise<PublicProjectionRow[]> {
  const source = trx ?? db;

  const rows: Record<string, unknown>[] = await source("request_public_projections")
    .where(PUBLISHED_PROJECTION_FILTER)
    .orderBy("updated_at", "asc")
    .select(...PROJECTION_COLUMNS);

  return rows.map(parsePublicProjectionRow);
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
