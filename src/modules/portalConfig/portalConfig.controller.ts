import path from "node:path";
import type { Request, Response } from "express";
import Config from "../../configs.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { saveFiles, removeFiles, type SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import type { AssetKey, PortalAssetsPatch } from "../../shared/types/portalConfig.ts";
import { portalAssetsPatchSchema } from "./portalConfig.schema.ts";
import {
  updateAccessSchema,
  updateCategoriesSchema,
  updateIdentitySchema,
  updatePrioritizationWeightsSchema,
  updateStatusesSchema,
  updateThemeSchema,
} from "./portalConfig.schema.ts";
import * as service from "./portalConfig.service.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actorUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return id;
}

// Chaves de asset com prefixo de URL do binário salvo (storage: `{key}-{uuid}`).
const ASSET_KEY_TO_URL_PATH: Record<AssetKey, string> = {
  logoLightUrl: "logo-light",
  logoDarkUrl: "logo-dark",
  avatarLightUrl: "avatar-light",
  avatarDarkUrl: "avatar-dark",
  loginImageLightUrl: "login-light",
  loginImageDarkUrl: "login-dark",
  faviconLightUrl: "favicon-light",
  faviconDarkUrl: "favicon-dark",
};

// ---------------------------------------------------------------------------
// R1 — GET /portal-config (público)
// ---------------------------------------------------------------------------

export const getConfig = async (_req: Request, res: Response): Promise<Response> => {
  const response = await service.getPortalConfig();
  return res.status(200).json(response);
};

// ---------------------------------------------------------------------------
// R2 — PATCH /portal-config/access
// ---------------------------------------------------------------------------

export const updateAccess = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateAccessSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.updateAccess(parsed.data.solicitationMode, actorUserId(req));
  return res.status(200).json(response);
};

// ---------------------------------------------------------------------------
// R3 — PATCH /portal-config/identity
// ---------------------------------------------------------------------------

export const updateIdentity = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateIdentitySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.updateIdentity(parsed.data, actorUserId(req));
  return res.status(200).json(response);
};

// ---------------------------------------------------------------------------
// R4 — PATCH /portal-config/theme
// ---------------------------------------------------------------------------

export const updateTheme = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateThemeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.updateTheme(parsed.data, actorUserId(req));
  return res.status(200).json(response);
};

// ---------------------------------------------------------------------------
// R5 — PATCH /portal-config/assets (multipart/form-data)
// ---------------------------------------------------------------------------

export const updateAssets = async (req: Request, res: Response): Promise<Response> => {
  // Parse JSON part `assets` do multipart. Multer `.fields()` sempre define
  // `req.files` (OBJECT vazio quando não há arquivo) — checar chaves, não
  // truthiness, senão um multipart sem nenhuma parte cai em 200 (contrato §5
  // exige 400).
  const rawAssets = req.body?.assets;
  const filesMap = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const hasBinary = Object.values(filesMap).some((list) => Array.isArray(list) && list.length > 0);
  if (!rawAssets && !hasBinary) {
    throw new AppError("Envie ao menos uma chave de asset (JSON ou arquivo).", 400);
  }

  let jsonPatch: PortalAssetsPatch = {};
  if (rawAssets) {
    let parsed: unknown;
    try {
      parsed = typeof rawAssets === "string" ? JSON.parse(rawAssets) : rawAssets;
    } catch {
      throw new AppError("JSON inválido na parte `assets`.", 400);
    }
    const validated = portalAssetsPatchSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AppError(formatZodIssues(validated.error, "assets"), 400);
    }
    jsonPatch = validated.data;
  }

  // Salva binários e monta URLs
  const files = filesMap;
  const savedAttachments: SavedAttachment[] = [];
  const binaryUrls: Record<string, string> = {};

  try {
    // Preserva o par (fieldName, arquivo) na MESMA ordem do flatMap usado no
    // saveFiles, para casar cada SavedAttachment com sua chave de asset.
    const assetEntries: Array<[string, Express.Multer.File]> = [];
    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fieldName === "assets") continue;
      for (const file of fileArray ?? []) {
        assetEntries.push([fieldName, file]);
      }
    }

    if (assetEntries.length > 0) {
      const targetDir = path.resolve(Config.UPLOAD_DIR, "portal");
      // Save directly with variant prefix so filename matches persisted URL.
      const saved = await saveFiles(
        assetEntries.map(([, file]) => file),
        targetDir,
        assetEntries.map(([fieldName]) => ASSET_KEY_TO_URL_PATH[fieldName as AssetKey]),
      );
      savedAttachments.push(...saved);

      saved.forEach((attachment, index) => {
        const fieldName = assetEntries[index]?.[0];
        if (!fieldName) return;
        binaryUrls[fieldName] = `/uploads/portal/${attachment.storageKey}`;
      });
    }

    // Merge: binário tem precedência sobre JSON para a mesma chave; o flag
    // booleano do logo vem apenas do JSON.
    const mergedPatch: PortalAssetsPatch = { ...jsonPatch, ...binaryUrls };

    const response = await service.updateAssetsUrl(mergedPatch, actorUserId(req));
    return res.status(200).json(response);
  } catch (err) {
    // Limpa binários já gravados em caso de falha
    if (savedAttachments.length > 0) {
      await removeFiles(savedAttachments);
    }
    throw err;
  }
};

// ---------------------------------------------------------------------------
// R6 — PATCH /portal-config/categories
// ---------------------------------------------------------------------------

export const updateCategories = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateCategoriesSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.updateCategories(parsed.data.categories, actorUserId(req));
  return res.status(200).json(response);
};

// ---------------------------------------------------------------------------
// R7 — PATCH /portal-config/statuses
// ---------------------------------------------------------------------------

export const updateStatuses = async (req: Request, res: Response): Promise<Response> => {
  const parsed = updateStatusesSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.updateStatuses(parsed.data.statuses, actorUserId(req));
  return res.status(200).json(response);
};

// ---------------------------------------------------------------------------
// R8 — PATCH /portal-config/prioritization-weights
// ---------------------------------------------------------------------------

export const updatePrioritizationWeights = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const parsed = updatePrioritizationWeightsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.updateCriteriaWeights(
    parsed.data.prioritizationWeights,
    actorUserId(req),
  );
  return res.status(200).json(response);
};
