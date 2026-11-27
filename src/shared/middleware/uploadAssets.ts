import type { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";
import path from "node:path";
import { AppError } from "../errors/AppError.ts";

/**
 * Regras de upload por chave de asset (contrato `portal-config-api2.md` §5).
 * Cada variante (light/dark) aceita os MIMEs, extensões e tamanho máximo do
 * seu tipo (logo, avatar, favicon ou imagem de login).
 */
export const ASSET_FILE_RULES: Record<
  string,
  { mimes: Set<string>; exts: Set<string>; maxBytes: number }
> = {
  logoLightUrl: {
    mimes: new Set(["image/png", "image/svg+xml"]),
    exts: new Set([".png", ".svg"]),
    maxBytes: 2 * 1024 * 1024,
  },
  logoDarkUrl: {
    mimes: new Set(["image/png", "image/svg+xml"]),
    exts: new Set([".png", ".svg"]),
    maxBytes: 2 * 1024 * 1024,
  },
  avatarLightUrl: {
    mimes: new Set(["image/jpeg", "image/png"]),
    exts: new Set([".jpg", ".jpeg", ".png"]),
    maxBytes: 2 * 1024 * 1024,
  },
  avatarDarkUrl: {
    mimes: new Set(["image/jpeg", "image/png"]),
    exts: new Set([".jpg", ".jpeg", ".png"]),
    maxBytes: 2 * 1024 * 1024,
  },
  faviconLightUrl: {
    mimes: new Set(["image/x-icon", "image/svg+xml", "image/png"]),
    exts: new Set([".ico", ".svg", ".png"]),
    maxBytes: 1 * 1024 * 1024,
  },
  faviconDarkUrl: {
    mimes: new Set(["image/x-icon", "image/svg+xml", "image/png"]),
    exts: new Set([".ico", ".svg", ".png"]),
    maxBytes: 1 * 1024 * 1024,
  },
  loginImageLightUrl: {
    mimes: new Set(["image/jpeg", "image/png", "image/webp"]),
    exts: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    maxBytes: 5 * 1024 * 1024,
  },
  loginImageDarkUrl: {
    mimes: new Set(["image/jpeg", "image/png", "image/webp"]),
    exts: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    maxBytes: 5 * 1024 * 1024,
  },
};

const MAX_FILE_SIZE = Math.max(...Object.values(ASSET_FILE_RULES).map((r) => r.maxBytes));
const MAX_FIELD_SIZE = 2 * 1024 * 1024; // JSON `assets` part

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 8,
    fields: 1,
    fieldSize: MAX_FIELD_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const rules = ASSET_FILE_RULES[file.fieldname];
    if (!rules) {
      cb(new AppError(`Campo de arquivo inesperado: "${file.fieldname}".`, 415));
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!rules.exts.has(ext)) {
      cb(
        new AppError(
          `Extensão "${ext}" não permitida para ${file.fieldname}. Aceitas: ${[...rules.exts].join(", ")}.`,
          415,
        ),
      );
      return;
    }

    if (!rules.mimes.has(file.mimetype)) {
      cb(
        new AppError(
          `MIME "${file.mimetype}" não permitido para ${file.fieldname}. Aceitos: ${[...rules.mimes].join(", ")}.`,
          415,
        ),
      );
      return;
    }

    cb(null, true);
  },
});

const multerFields = upload.fields([
  { name: "assets", maxCount: 1 },
  { name: "logoLightUrl", maxCount: 1 },
  { name: "logoDarkUrl", maxCount: 1 },
  { name: "avatarLightUrl", maxCount: 1 },
  { name: "avatarDarkUrl", maxCount: 1 },
  { name: "loginImageLightUrl", maxCount: 1 },
  { name: "loginImageDarkUrl", maxCount: 1 },
  { name: "faviconLightUrl", maxCount: 1 },
  { name: "faviconDarkUrl", maxCount: 1 },
]);

const MULTIPART_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: "Arquivo excede o tamanho máximo permitido para esta chave.",
  LIMIT_FILE_COUNT: "Máximo de 1 arquivo por chave de asset.",
  LIMIT_UNEXPECTED_FILE: "Parte de arquivo inesperada na requisição.",
};

/**
 * Middleware de upload de assets do portal. Valida MIME/extensão por chave
 * (415) e tamanho por chave (413). O JSON `assets` (campo `application/json`)
 * é parseado pelo controller.
 */
export function uploadAssetFields(req: Request, res: Response, next: NextFunction): void {
  multerFields(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof MulterError) {
      const message = MULTIPART_ERROR_MESSAGES[err.code] ?? "Erro ao processar o upload.";
      const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      next(new AppError(message, statusCode));
      return;
    }

    next(err);
  });
}

/**
 * Valida o tamanho de cada arquivo binário individual contra o máximo da chave.
 * Chamar após o multer para catch de tamanho que o fileSize global não
 * detecta (multer compara pelo total; cada arquivo pode ter até MAX_FILE_SIZE).
 */
export function validateAssetSizes(req: Request, _res: Response, next: NextFunction): void {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  if (!files) {
    next();
    return;
  }

  for (const [fieldName, fileArray] of Object.entries(files)) {
    const rules = ASSET_FILE_RULES[fieldName];
    if (!rules) continue;

    for (const file of fileArray) {
      if (file.size > rules.maxBytes) {
        const maxMb = (rules.maxBytes / (1024 * 1024)).toFixed(1);
        next(new AppError(`Arquivo "${file.originalname}" (${fieldName}) excede ${maxMb}MB.`, 413));
        return;
      }
    }
  }

  next();
}
