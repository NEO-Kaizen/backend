import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { isPublicationStatus, type PublicationStatus } from "../../shared/types/duplicates.ts";
import {
  DEFAULT_DUPLICATE_COMPLETED_WINDOW,
  DUPLICATE_COMPLETED_WINDOW_MONTHS,
  parseDuplicateCompletedWindow,
  warnDuplicateCompletedWindowFallback,
  type DuplicateCompletedWindow,
  type DuplicateCompletedWindowFallbackWarner,
} from "./completedWindow.ts";
import {
  COMPLETED_REQUEST_TEMPLATE_VERSION,
  COMPLETED_SUMMARY_TEMPLATE,
  COMPLETED_TEMPLATE_COLUMNS,
  COMPLETED_TITLE_TEMPLATE,
  type CompletedTemplatePart,
} from "./template.ts";

/**
 * Leitura da projeção pública, da flag de duplicidade e da fonte de publicação
 * (issue #209; concluídas na issue #210).
 *
 * As funções de busca e de índice NUNCA consultam `requests`: este repository
 * só conhece `request_public_projections` e `system_settings`. A leitura de
 * `requests` existe apenas em `findProjectionSource`, chamada por
 * `publishRequestProjection` para publicar ou suprimir a linha.
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

/** Linha interna que alimenta a decisão de publicação; nunca sai deste módulo. */
export interface ProjectionSourceRow {
  request_id: string;
  created_at: Date;
  title: string;
  need_description: string;
  problem_opportunity: string;
  /**
   * Texto ISO UTC com microssegundos. O driver `pg` converte `timestamptz` para
   * `Date` e perde a fração abaixo de milissegundo; a projeção precisa copiar o
   * valor exato de `requests.concluded_at`.
   */
  concluded_at: string | null;
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

export interface ExistingProjection {
  public_id: string;
  publication_status: PublicationStatus;
  published_at: Date | null;
  suppressed_at: Date | null;
  version: number;
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

function isNullableDate(value: unknown): value is Date | null {
  return value === null || value instanceof Date;
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
    !isNullableDate(public_concluded_at) ||
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

/**
 * Valida a linha da base interna antes de montar o snapshot público. A coluna
 * `is_within_window` vem calculada pelo PostgreSQL com o relógio do banco.
 *
 * O parse é fail-fast: shape inesperado sobe como erro e derruba a transação de
 * Status que chamou a publicação, em vez de publicar um snapshot degradado.
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
    !(concluded_at === null || typeof concluded_at === "string") ||
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
  const { public_id, publication_status, published_at, suppressed_at, version } = row;

  if (
    typeof public_id !== "string" ||
    !isPublicationStatus(publication_status) ||
    !isNullableDate(published_at) ||
    !isNullableDate(suppressed_at) ||
    typeof version !== "number"
  ) {
    throw new Error("Linha inválida em request_public_projections.");
  }

  return { public_id, publication_status, published_at, suppressed_at, version };
}

/**
 * Fontes da publicação: Solicitação + Categoria + Status + janela calculada
 * com o relógio do banco. Uma única consulta com `whereIn` para o caso isolado
 * e para a reavaliação em lote das allowlists (#212).
 */
export async function findProjectionSources(
  trx: Knex.Transaction,
  requestIds: readonly string[],
  window: DuplicateCompletedWindow,
): Promise<ProjectionSourceRow[]> {
  if (requestIds.length === 0) return [];

  const rows: Record<string, unknown>[] = await trx("requests as r")
    .join("categories as c", "c.category_id", "r.category_id")
    .join("statuses as s", "s.status_id", "r.status_id")
    .whereIn("r.request_id", requestIds)
    .select({
      request_id: "r.request_id",
      created_at: "r.created_at",
      title: "r.title",
      need_description: "r.need_description",
      problem_opportunity: "r.problem_opportunity",
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
        "to_char(r.concluded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') as concluded_at",
      ),
      trx.raw(
        "(r.concluded_at IS NOT NULL AND r.concluded_at >= now() - make_interval(months => ?)) as is_within_window",
        [window.months],
      ),
    );

  return rows.map(parseProjectionSourceRow);
}

export async function findProjectionSource(
  trx: Knex.Transaction,
  requestId: string,
  window: DuplicateCompletedWindow,
): Promise<ProjectionSourceRow | undefined> {
  const rows = await findProjectionSources(trx, [requestId], window);
  return rows[0];
}

/** Projeções existentes travadas para o upsert; o `public_id` é preservado. */
export async function findExistingProjectionsForUpdate(
  trx: Knex.Transaction,
  requestIds: readonly string[],
): Promise<Map<string, ExistingProjection>> {
  if (requestIds.length === 0) return new Map();

  const rows: Record<string, unknown>[] = await trx("request_public_projections")
    .whereIn("request_id", requestIds)
    .forUpdate()
    .select(
      "request_id",
      "public_id",
      "publication_status",
      "published_at",
      "suppressed_at",
      "version",
    );

  return new Map(
    rows.map((row) => {
      const { request_id } = row;
      if (typeof request_id !== "string") {
        throw new Error("Linha inválida em request_public_projections.");
      }
      return [request_id, parseExistingProjection(row)];
    }),
  );
}

export async function findExistingProjectionForUpdate(
  trx: Knex.Transaction,
  requestId: string,
): Promise<ExistingProjection | undefined> {
  const rows = await findExistingProjectionsForUpdate(trx, [requestId]);
  return rows.get(requestId);
}

/**
 * Serializa escritas de projeção com edições administrativas de flag/janela e
 * allowlists (#212): todas usam `FOR UPDATE` na mesma linha do singleton.
 * Adquirido no início de `publishRequestProjection`, antes de qualquer leitura
 * de `requests`/`categories`/`statuses`, para evitar *lost update* concorrente.
 */
export async function lockDuplicateSettings(trx: Knex.Transaction): Promise<void> {
  await trx("system_settings").where({ settings_id: 1 }).forUpdate().first();
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
 * `public_id` da projeção **publicada** de uma Solicitação (issue #211).
 *
 * O Acompanhamento usa o identificador para excluir a própria Solicitação do
 * resultado. Linha ausente ou suprimida devolve `undefined`, e o endpoint
 * responde vazio: a seção só existe para quem tem a Solicitação publicada.
 */
export async function findPublishedPublicIdByRequestId(
  requestId: string,
): Promise<string | undefined> {
  const row: { public_id: string } | undefined = await db("request_public_projections")
    .where({ request_id: requestId })
    .where(PUBLISHED_PROJECTION_FILTER)
    .first("public_id");

  return row?.public_id;
}

export interface GetDuplicateCompletedWindowOptions {
  trx?: Knex.Transaction;
  onFallback: DuplicateCompletedWindowFallbackWarner;
}

/**
 * Janela do corpus de concluídas. O CHECK da migration garante 1..36; singleton
 * ausente ou valor inválido cai para o padrão 3 com aviso explícito do
 * chamador, para um banco mal configurado não publicar em silêncio.
 */
export async function getDuplicateCompletedWindow({
  trx,
  onFallback,
}: GetDuplicateCompletedWindowOptions): Promise<DuplicateCompletedWindow> {
  const source = trx ?? db;
  const row: Record<string, unknown> | undefined = await source("system_settings")
    .where({ settings_id: 1 })
    .first("duplicate_completed_window_months");

  const window = parseDuplicateCompletedWindow(row?.duplicate_completed_window_months);

  if (window) return window;

  onFallback(
    `[duplicates] duplicate_completed_window_months ausente ou fora de ${DUPLICATE_COMPLETED_WINDOW_MONTHS.min}..${DUPLICATE_COMPLETED_WINDOW_MONTHS.max}; usando ${DUPLICATE_COMPLETED_WINDOW_MONTHS.default}.`,
  );

  return DEFAULT_DUPLICATE_COMPLETED_WINDOW;
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
  const window = await getDuplicateCompletedWindow({
    trx,
    onFallback: warnDuplicateCompletedWindowFallback,
  });

  const rows: Record<string, unknown>[] = await source("request_public_projections")
    .where(PUBLISHED_PROJECTION_FILTER)
    .andWhere((builder) => {
      builder
        .whereNull("public_concluded_at")
        .orWhereRaw("public_concluded_at >= now() - make_interval(months => ?)", [window.months]);
    })
    .orderBy("updated_at", "asc")
    .select(...PROJECTION_COLUMNS);

  return rows.map(parsePublicProjectionRow);
}

/**
 * Traduz as partes do template de concluída para uma expressão SQL que lê as
 * colunas do snapshot. Estrutura e ordem vêm de `template.ts`.
 */
function buildTemplateExpression(
  source: Knex | Knex.Transaction,
  parts: readonly CompletedTemplatePart[],
): Knex.Raw {
  const fragments: string[] = [];
  const bindings: string[] = [];

  for (const part of parts) {
    if ("literal" in part) {
      fragments.push("?");
      bindings.push(part.literal);
      continue;
    }

    fragments.push(COMPLETED_TEMPLATE_COLUMNS[part.field]);
  }

  return source.raw(fragments.join(" || "), bindings);
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
  window: DuplicateCompletedWindow,
  trx?: Knex.Transaction,
): Promise<number> {
  const source = trx ?? db;

  return source("request_public_projections")
    .where(PUBLISHED_PROJECTION_FILTER)
    .whereNotNull("public_concluded_at")
    .whereRaw("public_concluded_at < now() - make_interval(months => ?)", [window.months])
    .update({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
      suppressed_at: source.fn.now(),
      public_title: buildTemplateExpression(source, COMPLETED_TITLE_TEMPLATE),
      public_summary: buildTemplateExpression(source, COMPLETED_SUMMARY_TEMPLATE),
      redaction_version: COMPLETED_REQUEST_TEMPLATE_VERSION,
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
  window: DuplicateCompletedWindow,
  trx?: Knex.Transaction,
): Promise<string[]> {
  const source = trx ?? db;
  const rows: Record<string, unknown>[] = await source("request_public_projections")
    .where({
      publication_status: "suppressed",
      suppression_reason: "outside_window",
    })
    .whereNotNull("public_concluded_at")
    .whereRaw("public_concluded_at >= now() - make_interval(months => ?)", [window.months])
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

function parseRequestIds(rows: Record<string, unknown>[]): string[] {
  return rows.map((row) => {
    const { request_id } = row;
    if (typeof request_id !== "string") {
      throw new Error("Linha inválida em requests ao listar projeções afetadas.");
    }
    return request_id;
  });
}

/**
 * Solicitações afetadas por mudanças nas allowlists de Categoria e/ou Status
 * (#212). Uma única consulta com `whereIn` nas duas colunas — a leitura é da
 * base interna porque a projeção pode não existir para Solicitações anteriores
 * ao RF16.
 */
export async function listRequestIdsForAllowlists(
  trx: Knex.Transaction,
  categoryIds: readonly number[],
  statusIds: readonly number[],
): Promise<string[]> {
  if (categoryIds.length === 0 && statusIds.length === 0) return [];

  const rows: Record<string, unknown>[] = await trx("requests")
    .where((builder) => {
      if (categoryIds.length > 0) builder.orWhereIn("category_id", categoryIds);
      if (statusIds.length > 0) builder.orWhereIn("status_id", statusIds);
    })
    .distinct()
    .select("request_id");

  return parseRequestIds(rows);
}
