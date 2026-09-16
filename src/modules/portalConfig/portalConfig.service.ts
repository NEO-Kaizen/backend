import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import { canonicalJson } from "../../shared/utils/json.ts";
import db from "../../database/conection.ts";
import type {
  AccessSection,
  AssetsSection,
  CategoriesSection,
  IdentitySection,
  PortalAssetsPatch,
  PortalCategory,
  PortalStatus,
  PrioritizationWeights,
  PrioritizationWeightsSection,
  StatusesSection,
  ThemeSection,
} from "../../shared/types/portalConfig.ts";
import { CRITERION_ID_TO_KEY } from "../../shared/types/criteria.ts";
import type { SystemSettingsRow } from "../../shared/types/systemSettings.ts";
import { themeFromRow, themeToColumns } from "./portalConfig.mappers.ts";
import * as repository from "./portalConfig.repository.ts";
import type { PortalConfigResponse } from "../DTOs/portalConfig/PortalConfigResponse.dto.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Monta `PortalAssets` (contrato api2) a partir da linha `system_settings`. */
function assetsFromRow(settings: SystemSettingsRow) {
  return {
    logoLightUrl: settings.logo_light_url ?? "",
    logoDarkUrl: settings.logo_dark_url ?? "",
    logoUsePrimaryColor: settings.logo_use_primary_color,
    avatarLightUrl: settings.avatar_light_url ?? "",
    avatarDarkUrl: settings.avatar_dark_url ?? "",
    loginImageLightUrl: settings.login_image_light_url ?? "",
    loginImageDarkUrl: settings.login_image_dark_url ?? "",
    faviconLightUrl: settings.favicon_light_url ?? "",
    faviconDarkUrl: settings.favicon_dark_url ?? "",
  };
}

// ---------------------------------------------------------------------------
// R1 — GET /portal-config (público)
// ---------------------------------------------------------------------------

export async function getPortalConfig(): Promise<PortalConfigResponse> {
  const [settings, themeRow, categories, statuses, criteria] = await Promise.all([
    repository.getSettingsRow(),
    repository.getThemeRow(),
    repository.listCategories(),
    repository.listStatuses(),
    repository.listCriteria(),
  ]);

  const theme = themeFromRow(themeRow);

  return {
    platformName: settings.platform_name,
    solicitationMode: settings.solicitation_mode,
    protocolMask: settings.protocol_mask,
    theme,
    assets: assetsFromRow(settings),
    categories: categories.map((cat) => ({
      id: cat.category_id,
      name: cat.name,
      description: cat.description ?? "",
      isActive: cat.status === "active",
    })),
    statuses: statuses.map((st) => ({
      id: st.status_id,
      name: st.name,
      visibility: st.visibility,
      closesRequest: st.closes_request,
      tone: st.tone,
    })),
    prioritizationWeights: Object.fromEntries(
      criteria.map((c) => {
        const key = CRITERION_ID_TO_KEY[c.criterion_id];
        return [key ?? c.criterion_id, c.weight];
      }),
    ) as PrioritizationWeights,
  };
}

// ---------------------------------------------------------------------------
// R2 — PATCH /portal-config/access
// ---------------------------------------------------------------------------

export async function updateAccess(
  solicitationMode: string,
  userId: number,
): Promise<AccessSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const settings = await repository.getSettingsRow(trx);
    const previous = { solicitationMode: settings.solicitation_mode };

    await repository.updateSettingsAccess(trx, solicitationMode, userId);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson({ solicitationMode }),
    });

    return { solicitationMode: solicitationMode as AccessSection["solicitationMode"] };
  });
}

// ---------------------------------------------------------------------------
// R3 — PATCH /portal-config/identity
// ---------------------------------------------------------------------------

export async function updateIdentity(
  fields: { platformName?: string; protocolMask?: string },
  userId: number,
): Promise<IdentitySection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const settings = await repository.getSettingsRow(trx);
    const previous = {
      platformName: settings.platform_name,
      protocolMask: settings.protocol_mask,
    };

    await repository.updateSettingsIdentity(trx, fields, userId);

    const updated = await repository.getSettingsRow(trx);
    const newValue = {
      platformName: updated.platform_name,
      protocolMask: updated.protocol_mask,
    };

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(newValue),
    });

    return newValue;
  });
}

// ---------------------------------------------------------------------------
// R4 — PATCH /portal-config/theme
// ---------------------------------------------------------------------------

export async function updateTheme(
  themeSection: ThemeSection,
  userId: number,
): Promise<ThemeSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);
    await repository.lockTheme(trx);

    const themeRow = await repository.getThemeRow(trx);
    const previousTheme = themeFromRow(themeRow);
    const columns = themeToColumns(themeSection.theme);

    await repository.updateTheme(trx, columns, userId);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson({ theme: previousTheme }),
      newValue: canonicalJson(themeSection),
    });

    return themeSection;
  });
}

// ---------------------------------------------------------------------------
// R5 — PATCH /portal-config/assets (JSON direto — binários tratados no controller)
// ---------------------------------------------------------------------------

export async function updateAssetsUrl(
  patch: PortalAssetsPatch,
  userId: number,
): Promise<AssetsSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const settings = await repository.getSettingsRow(trx);
    const previous = { assets: assetsFromRow(settings) };

    await repository.updateAssets(trx, patch, userId);

    const updated = await repository.getSettingsRow(trx);
    const newValue = { assets: assetsFromRow(updated) };

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(newValue),
    });

    return newValue;
  });
}

// ---------------------------------------------------------------------------
// R6 — PATCH /portal-config/categories
// ---------------------------------------------------------------------------

export async function updateCategories(
  categories: PortalCategory[],
  userId: number,
): Promise<CategoriesSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const prevRows = await repository.listCategories(trx);
    const previous = prevRows.map((cat) => ({
      id: cat.category_id,
      name: cat.name,
      description: cat.description ?? "",
      isActive: cat.status === "active",
    }));

    await repository.upsertCategories(trx, categories);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(categories),
    });

    return { categories };
  });
}

// ---------------------------------------------------------------------------
// R7 — PATCH /portal-config/statuses
// ---------------------------------------------------------------------------

/**
 * Statuses com nomes referenciados diretamente no código (requests.ts /
 * queue.ts). Renomeá-los ou removê-los quebraria o fluxo sem alinhamento
 * prévio com o contrato de solicitações (§6.1 do plano issue-59).
 */
const PROTECTED_STATUS_NAMES = new Set([
  "Solicitação enviada",
  "Em triagem",
  "Em mapeamento",
  "Em análise de viabilidade",
  "Em desenvolvimento",
  "Em homologação",
  "Concluído",
  "Cancelado",
]);

export async function updateStatuses(
  statuses: PortalStatus[],
  userId: number,
): Promise<StatusesSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const prevRows = await repository.listStatuses(trx);
    const previous = prevRows.map((st) => ({
      id: st.status_id,
      name: st.name,
      visibility: st.visibility,
      closesRequest: st.closes_request,
      tone: st.tone,
    }));

    // Bloqueia renomeação ou remoção de status protegidos (§6.1).
    const prevByName = new Map(prevRows.map((st) => [st.name, st]));
    const newByName = new Map(statuses.map((s) => [s.name, s]));

    for (const protectedName of PROTECTED_STATUS_NAMES) {
      const existing = prevByName.get(protectedName);
      if (!existing) continue;

      const incoming = newByName.get(protectedName);
      if (!incoming) {
        throw new AppError(
          `Não é possível remover o status protegido "${protectedName}" (referenciado pelo fluxo de solicitações).`,
          409,
        );
      }
      if (incoming.id !== existing.status_id) {
        throw new AppError(
          `O status protegido "${protectedName}" possui id fixo (${existing.status_id}).`,
          409,
        );
      }
    }

    await repository.upsertStatuses(trx, statuses);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(statuses),
    });

    return { statuses };
  });
}

// ---------------------------------------------------------------------------
// R8 — PATCH /portal-config/prioritization-weights
// ---------------------------------------------------------------------------

export async function updateCriteriaWeights(
  weights: PrioritizationWeights,
  userId: number,
): Promise<PrioritizationWeightsSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const prevRows = await repository.listCriteria(trx);
    const previous = Object.fromEntries(
      prevRows.map((c) => {
        const key = CRITERION_ID_TO_KEY[c.criterion_id];
        return [key ?? c.criterion_id, c.weight];
      }),
    );

    await repository.updateCriteriaWeights(trx, weights);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(weights),
    });

    return { prioritizationWeights: weights };
  });
}
