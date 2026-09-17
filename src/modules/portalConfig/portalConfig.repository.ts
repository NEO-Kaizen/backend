import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type {
  PortalSolicitationMode,
  SystemSettingsRow,
} from "../../shared/types/systemSettings.ts";
import type { SystemThemeRow } from "../../shared/types/systemTheme.ts";
import type {
  CategoryRow,
  PortalAssetsPatch,
  PortalCategory,
  PortalStatus,
  StatusRow,
} from "../../shared/types/portalConfig.ts";
import { CRITERION_KEY_TO_ID } from "../../shared/types/criteria.ts";

// ---------------------------------------------------------------------------
// Reads (GET /portal-config)
// ---------------------------------------------------------------------------

export async function getSettingsRow(trx?: Knex.Transaction): Promise<SystemSettingsRow> {
  const source = trx ?? db;
  const row = (await source("system_settings").where({ settings_id: 1 }).first()) as
    SystemSettingsRow | undefined;
  if (!row) {
    throw new Error("system_settings singleton não encontrado (settings_id=1).");
  }
  return row;
}

/**
 * Leitura enxuta do modo de abertura do portal, usada pelo guard de acesso
 * (`requireAccessMode`) a cada request. Defensivo: a ausência do singleton é
 * tratada como `PUBLIC` (o registro é garantido por migration, mas o guard não
 * deve derrubar o servidor se a linha faltar).
 */
export async function getSolicitationMode(): Promise<PortalSolicitationMode> {
  const row = (await db("system_settings").where({ settings_id: 1 }).first("solicitation_mode")) as
    Pick<SystemSettingsRow, "solicitation_mode"> | undefined;

  return row?.solicitation_mode ?? "PUBLIC";
}

export async function getThemeRow(trx?: Knex.Transaction): Promise<SystemThemeRow | undefined> {
  const source = trx ?? db;
  return source("system_themes").where({ theme_id: 1 }).first() as Promise<
    SystemThemeRow | undefined
  >;
}

export async function listCategories(trx?: Knex.Transaction): Promise<CategoryRow[]> {
  const source = trx ?? db;
  return source("categories").orderBy("display_order", "asc") as Promise<CategoryRow[]>;
}

export async function listStatuses(trx?: Knex.Transaction): Promise<StatusRow[]> {
  const source = trx ?? db;
  return source("statuses").where({ is_active: true }).orderBy("order_number", "asc") as Promise<
    StatusRow[]
  >;
}

interface CriteriaRow {
  criterion_id: string;
  weight: number;
}

export async function listCriteria(trx?: Knex.Transaction): Promise<CriteriaRow[]> {
  const source = trx ?? db;
  return source("criteria")
    .where({ active: true })
    .orderBy("display_order", "asc")
    .select("criterion_id", "weight") as Promise<CriteriaRow[]>;
}

// ---------------------------------------------------------------------------
// Locks
// ---------------------------------------------------------------------------

export async function lockSettings(trx: Knex.Transaction): Promise<void> {
  await trx("system_settings").where({ settings_id: 1 }).forUpdate().first();
}

export async function lockTheme(trx: Knex.Transaction): Promise<void> {
  await trx("system_themes").where({ theme_id: 1 }).forUpdate().first();
}

// ---------------------------------------------------------------------------
// PATCH updates
// ---------------------------------------------------------------------------

export async function updateSettingsAccess(
  trx: Knex.Transaction,
  solicitationMode: string,
  actorUserId: number,
): Promise<void> {
  await trx("system_settings").where({ settings_id: 1 }).update({
    solicitation_mode: solicitationMode,
    updated_by: actorUserId,
    updated_at: new Date().toISOString(),
  });
}

export async function updateSettingsIdentity(
  trx: Knex.Transaction,
  fields: { platformName?: string; protocolMask?: string },
  actorUserId: number,
): Promise<void> {
  const update: Record<string, string> = {
    updated_by: String(actorUserId),
    updated_at: new Date().toISOString(),
  };
  if (fields.platformName !== undefined) update.platform_name = fields.platformName;
  if (fields.protocolMask !== undefined) update.protocol_mask = fields.protocolMask;

  await trx("system_settings").where({ settings_id: 1 }).update(update);
}

export async function updateTheme(
  trx: Knex.Transaction,
  themeColumns: Record<string, string | number | boolean>,
  actorUserId: number,
): Promise<void> {
  const now = new Date().toISOString();
  await trx("system_themes")
    .where({ theme_id: 1 })
    .update({
      ...themeColumns,
      updated_at: now,
    });

  await trx("system_settings")
    .where({ settings_id: 1 })
    .update({ updated_by: String(actorUserId), updated_at: now });
}

export async function updateAssets(
  trx: Knex.Transaction,
  patch: PortalAssetsPatch,
  actorUserId: number,
): Promise<void> {
  const now = new Date().toISOString();
  const update: Record<string, string | boolean> = {
    updated_by: String(actorUserId),
    updated_at: now,
  };
  if (patch.logoLightUrl !== undefined) update.logo_light_url = patch.logoLightUrl;
  if (patch.logoDarkUrl !== undefined) update.logo_dark_url = patch.logoDarkUrl;
  if (patch.logoUsePrimaryColor !== undefined)
    update.logo_use_primary_color = patch.logoUsePrimaryColor;
  if (patch.avatarLightUrl !== undefined) update.avatar_light_url = patch.avatarLightUrl;
  if (patch.avatarDarkUrl !== undefined) update.avatar_dark_url = patch.avatarDarkUrl;
  if (patch.loginImageLightUrl !== undefined)
    update.login_image_light_url = patch.loginImageLightUrl;
  if (patch.loginImageDarkUrl !== undefined) update.login_image_dark_url = patch.loginImageDarkUrl;
  if (patch.faviconLightUrl !== undefined) update.favicon_light_url = patch.faviconLightUrl;
  if (patch.faviconDarkUrl !== undefined) update.favicon_dark_url = patch.faviconDarkUrl;

  await trx("system_settings").where({ settings_id: 1 }).update(update);
}

// ---------------------------------------------------------------------------
// Categories upsert (R6)
// ---------------------------------------------------------------------------

export async function upsertCategories(
  trx: Knex.Transaction,
  categories: PortalCategory[],
): Promise<void> {
  for (const category of categories) {
    await trx("categories")
      .insert({
        category_id: category.id,
        name: category.name,
        description: category.description || null,
        status: category.isActive ? "active" : "inactive",
        display_order: categories.indexOf(category),
      })
      .onConflict("category_id")
      .merge({
        name: category.name,
        description: category.description || null,
        status: category.isActive ? "active" : "inactive",
        display_order: categories.indexOf(category),
      });
  }

  const keepIds = categories.map((c) => c.id);
  if (keepIds.length > 0) {
    await trx("categories")
      .whereNotIn("category_id", keepIds)
      .andWhere({ status: "active" })
      .update({ status: "inactive" });
  }

  await trx.raw(
    "SELECT setval('categories_category_id_seq', GREATEST((SELECT MAX(category_id) FROM categories), 1))",
  );
}

// ---------------------------------------------------------------------------
// Statuses upsert (R7)
// ---------------------------------------------------------------------------

/**
 * Statuses cujos nomes são referenciados diretamente no código (requests.ts,
 * queue.ts). Renomeá-los ou removê-los quebraria o fluxo sem alinhamento.
 */
export const PROTECTED_STATUS_NAMES = new Set([
  "Solicitação enviada",
  "Em triagem",
  "Em mapeamento",
  "Em análise de viabilidade",
  "Em desenvolvimento",
  "Em homologação",
  "Concluído",
  "Cancelado",
]);

export async function upsertStatuses(
  trx: Knex.Transaction,
  statuses: PortalStatus[],
): Promise<void> {
  for (const status of statuses) {
    await trx("statuses")
      .insert({
        status_id: status.id,
        name: status.name,
        order_number: statuses.indexOf(status),
        visibility: status.visibility,
        closes_request: status.closesRequest,
        tone: status.tone,
        is_active: true,
        is_final: status.closesRequest,
      })
      .onConflict("status_id")
      .merge({
        name: status.name,
        order_number: statuses.indexOf(status),
        visibility: status.visibility,
        closes_request: status.closesRequest,
        tone: status.tone,
        is_active: true,
        is_final: status.closesRequest,
      });
  }

  const keepIds = statuses.map((s) => s.id);
  if (keepIds.length > 0) {
    await trx("statuses")
      .whereNotIn("status_id", keepIds)
      .andWhere({ is_active: true })
      .update({ is_active: false });
  }

  await trx.raw(
    "SELECT setval('statuses_status_id_seq', GREATEST((SELECT MAX(status_id) FROM statuses), 1))",
  );
}

// ---------------------------------------------------------------------------
// Criteria weights (R8)
// ---------------------------------------------------------------------------

export async function updateCriteriaWeights(
  trx: Knex.Transaction,
  weights: Record<string, number>,
): Promise<void> {
  for (const [contractKey, weight] of Object.entries(weights)) {
    const criterionId = CRITERION_KEY_TO_ID[contractKey as keyof typeof CRITERION_KEY_TO_ID];
    if (!criterionId) continue;
    await trx("criteria")
      .where({ criterion_id: criterionId })
      .update({ weight, updated_at: new Date().toISOString() });
  }
}
