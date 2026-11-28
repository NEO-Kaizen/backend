import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import { canonicalJson } from "../../shared/utils/json.ts";
import db from "../../database/conection.ts";
import type {
  AccessSection,
  AssetsSection,
  CategoriesSection,
  CategoryRow,
  DuplicateDetectionSettings,
  IdentitySection,
  PortalAssetsPatch,
  PortalCategory,
  PortalStatus,
  PrioritizationWeights,
  PrioritizationWeightsSection,
  SolicitationMode,
  StatusesSection,
  StatusRow,
  ThemeSection,
} from "../../shared/types/portalConfig.ts";
import { CRITERION_ID_TO_KEY } from "../../shared/types/criteria.ts";
import { CORE_STATUS_IDS } from "../../shared/types/portalConfig.ts";
import { STATUS_IDS } from "../../shared/types/status.ts";
import type { SystemSettingsRow } from "../../shared/types/systemSettings.ts";
import { themeFromRow, themeToColumns } from "./portalConfig.mappers.ts";
import * as repository from "./portalConfig.repository.ts";
import { republishAffectedProjections } from "../duplicates/duplicates.republish.ts";
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
    isCore: st.is_core ?? false,
    isPublic: st.is_public ?? false,
    isTerminal: st.is_terminal ?? false,
    triageMode: st.triage_mode ?? "none",
    mappingMode: st.mapping_mode ?? "none",
    isRestricted: st.is_restricted ?? false,
    tone: st.tone,
    isActive: st.is_active,
    isDuplicateCorpusEligible: st.is_duplicate_corpus_eligible,
  };
}

/** Projeção de `categories` para o contrato (usada antes e depois do PATCH). */
function categoryToPortal(cat: CategoryRow): PortalCategory {
  return {
    id: cat.category_id,
    name: cat.name,
    description: cat.description ?? "",
    isActive: cat.status === "active",
    isPubliclyListable: cat.is_publicly_listable,
  };
}

/**
 * Ids cuja projeção precisa ser reavaliada: itens alterados em algum campo que
 * participa da decisão de publicação, mais itens omitidos (que o upsert
 * desativa/tira da allowlist). Uma única implementação para Categoria e Status.
 */
function changedAllowlistIds<Before, After>(
  previous: readonly Before[],
  incoming: readonly After[],
  idBefore: (row: Before) => number,
  idAfter: (row: After) => number,
  changed: (before: Before, after: After) => boolean,
): number[] {
  const previousById = new Map(previous.map((row) => [idBefore(row), row]));
  const incomingIds = new Set(incoming.map(idAfter));
  const affected = new Set<number>();

  for (const after of incoming) {
    const before = previousById.get(idAfter(after));
    if (!before || changed(before, after)) affected.add(idAfter(after));
  }
  for (const before of previous) {
    if (!incomingIds.has(idBefore(before))) affected.add(idBefore(before));
  }

  return [...affected];
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
    categories: categories.map(categoryToPortal),
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
  solicitationMode: SolicitationMode,
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

    return { solicitationMode };
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
    const previous = prevRows.map(categoryToPortal);

    await repository.upsertCategories(trx, categories);

    // Nome e allowlist entram no snapshot público; itens omitidos são tirados
    // da allowlist pelo upsert e também precisam ser suprimidos (#212).
    const affectedIds = changedAllowlistIds(
      prevRows,
      categories,
      (row) => row.category_id,
      (category) => category.id,
      (before, after) =>
        before.name !== after.name || before.is_publicly_listable !== after.isPubliclyListable,
    );
    await republishAffectedProjections(trx, affectedIds, []);

    const updatedRows = await repository.listCategories(trx);
    const newValue = updatedRows.map(categoryToPortal);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(newValue),
    });

    return { categories: newValue };
  });
}

// ---------------------------------------------------------------------------
// R7 — PATCH /portal-config/statuses
// ---------------------------------------------------------------------------

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
      if (!existing) {
        throw new AppError(
          `O status de núcleo com id ${coreId} não existe. Execute a migration de status v4 antes de atualizar a configuração.`,
          409,
          "core_status_missing",
        );
      }

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
      if (!incoming.isCore) {
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
        incoming.isPublic !== (existing.is_public ?? false) ||
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
      // Apenas os desfechos protegidos pela regra de duplicidade são travados:
      // o 16 precisa continuar elegível e o 17 fora da allowlist (issue #212).
      // Os demais status de núcleo são administráveis como sempre foram.
      if (
        (coreId === STATUS_IDS.completed || coreId === STATUS_IDS.canceled) &&
        incoming.isDuplicateCorpusEligible !== existing.is_duplicate_corpus_eligible
      ) {
        throw new AppError(
          `A elegibilidade para o corpus de duplicidade do status "${existing.name}" (id ${coreId}) é imutável.`,
          409,
          "core_status_corpus_eligibility_locked",
        );
      }
    }

    await repository.upsertStatuses(trx, statuses);

    // Além da allowlist, `isActive`, `isTerminal` e `isRestricted` alimentam a
    // precedência de supressão. Qualquer uma delas pode mudar em status
    // não-core, então todas exigem reavaliação das projeções (#212).
    const affectedStatusIds = changedAllowlistIds(
      prevRows,
      statuses,
      (row) => row.status_id,
      (status) => status.id,
      (before, after) =>
        before.is_duplicate_corpus_eligible !== after.isDuplicateCorpusEligible ||
        before.is_active !== after.isActive ||
        before.is_terminal !== after.isTerminal ||
        before.is_restricted !== after.isRestricted,
    );
    await republishAffectedProjections(trx, [], affectedStatusIds);

    const updatedRows = await repository.listStatuses(trx);
    const newValue = updatedRows.map(statusToPortal);

    await recordAudit(trx, {
      entityType: "settings",
      entityId: "settings",
      actionType: "settings.update",
      userId,
      previousValue: canonicalJson(previous),
      newValue: canonicalJson(newValue),
    });

    return { statuses: newValue };
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

// ---------------------------------------------------------------------------
// R9 — PATCH /portal-config/duplicates
// ---------------------------------------------------------------------------

export async function updateDuplicateDetection(
  settings: DuplicateDetectionSettings,
  userId: number,
): Promise<DuplicateDetectionSettings> {
  return db.transaction(async (trx) => {
    await repository.lockSettings(trx);

    const current = await repository.getSettingsRow(trx);
    // Mesmas chaves antes/depois: a auditoria precisa ser comparável diretamente.
    const previous: DuplicateDetectionSettings = {
      enabled: current.duplicate_detection_enabled,
      completedWindowMonths: current.duplicate_completed_window_months,
    };

    await repository.updateDuplicateDetectionSettings(trx, settings, userId);

    const updated = await repository.getSettingsRow(trx);
    const newValue: DuplicateDetectionSettings = {
      enabled: updated.duplicate_detection_enabled,
      completedWindowMonths: updated.duplicate_completed_window_months,
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
