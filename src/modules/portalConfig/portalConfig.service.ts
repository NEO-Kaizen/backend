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
  StatusRow,
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

/** Projeta uma linha de `statuses` para o `PortalStatus` do contrato v4. */
function statusToPortal(st: StatusRow): PortalStatus {
  return {
    id: st.status_id,
    name: st.name,
    order: st.order_number,
    isCore: st.is_core ?? false,
    isPublic: (st.visibility ?? "PUBLIC") === "PUBLIC",
    isTerminal: st.is_terminal ?? false,
    triageMode: st.triage_mode ?? "none",
    mappingMode: st.mapping_mode ?? "none",
    isRestricted: st.is_restricted ?? false,
    tone: st.tone,
    isActive: st.is_active ?? true,
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
    statuses: statuses.map(statusToPortal),
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
 * Statuses de núcleo do Anexo A (ids fixos) — não podem ser removidos,
 * renomeados, rebaixados a não-núcleo ou desativados. Substituem o lock por
 * nome da versão pré-v4 (holofote nos ids imutáveis do Motor de Status v4).
 */
const CORE_STATUS_IDS = new Set([1, 3, 4, 7, 16, 17]);

export async function updateStatuses(
  statuses: PortalStatus[],
  userId: number,
): Promise<StatusesSection> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const prevRows = await repository.listStatuses(trx);
    const previous = prevRows.map(statusToPortal);
    const prevById = new Map(prevRows.map((st) => [st.status_id, st]));
    const incomingById = new Map(statuses.map((s) => [s.id, s]));

    for (const coreId of CORE_STATUS_IDS) {
      const existing = prevById.get(coreId);
      if (!existing) continue;

      const incoming = incomingById.get(coreId);
      if (!incoming) {
        throw new AppError(
          `Não é possível remover o status de núcleo "${existing.name}" (id ${coreId} — referenciado pelo fluxo).`,
          409,
          "core_status_removed",
        );
      }
      if (incoming.name !== existing.name) {
        throw new AppError(
          `Não é possível renomear o status de núcleo "${existing.name}" (id ${coreId}).`,
          409,
          "core_status_renamed",
        );
      }
      if (incoming.isCore === false) {
        throw new AppError(
          `Não é possível redefinir o status de núcleo "${existing.name}" como não-núcleo (id ${coreId}).`,
          409,
          "core_status_forced",
        );
      }
      if (incoming.isActive === false) {
        throw new AppError(
          `Não é possível desativar o status de núcleo "${existing.name}" (id ${coreId}).`,
          409,
          "core_status_forced_inactive",
        );
      }
      // Flags estruturais do núcleo são imutáveis via PATCH (mudança de modo
      // de um status core quebraria o motor — exige migration versionada).
      if (
        incoming.isTerminal !== existing.is_terminal ||
        incoming.isRestricted !== existing.is_restricted ||
        incoming.triageMode !== existing.triage_mode ||
        incoming.mappingMode !== existing.mapping_mode
      ) {
        throw new AppError(
          `Flags/modos do status de núcleo "${existing.name}" (id ${coreId}) são imutáveis.`,
          409,
          "core_status_locked",
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
