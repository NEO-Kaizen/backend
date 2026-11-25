import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { PublicationStatus } from "./projection.ts";

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

  return (await source("request_public_projections")
    .where({ publication_status: "published", is_publicly_listable: true })
    .orderBy("updated_at", "asc")
    .select(...PROJECTION_COLUMNS)) as PublicProjectionRow[];
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

  return (await source("request_public_projections")
    .where("updated_at", ">=", since)
    .orderBy("updated_at", "asc")
    .select(...PROJECTION_COLUMNS)) as PublicProjectionRow[];
}
