import type { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";

/**
 * Multer para upload de avatar de perfil (Issue #125).
 *
 * Reutiliza o padrão de asset do portal para um único arquivo JPEG/PNG de
 * até 2 MB (campo `avatar`). Valida MIME/extensão (415) no fileFilter e
 * traduz os erros do multer para o envelope da API: estouro de tamanho →
 * 413, demais erros de multipart → 400 (consistência com `uploadAssets`).
 */
const avatarRules = {
  mimes: new Set(["image/jpeg", "image/png"]),
  exts: new Set([".jpg", ".jpeg", ".png"]),
  maxBytes: 2 * 1024 * 1024,
};

const MAX_FIELD_SIZE = 2 * 1024 * 1024; // JSON `payload` part

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: avatarRules.maxBytes,
    files: 1,
    fields: 1,
    fieldSize: MAX_FIELD_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname !== "avatar") {
      cb(new AppError(`Campo de arquivo inesperado: "${file.fieldname}".`, 415));
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!avatarRules.exts.has(ext)) {
      cb(
        new AppError(
          `Extensão "${ext}" não permitida para avatar. Aceitas: ${[...avatarRules.exts].join(", ")}.`,
          415,
        ),
      );
      return;
    }

    if (!avatarRules.mimes.has(file.mimetype)) {
      cb(
        new AppError(
          `MIME "${file.mimetype}" não permitido para avatar. Aceitos: ${[...avatarRules.mimes].join(", ")}.`,
          415,
        ),
      );
      return;
    }

    cb(null, true);
  },
});

const single = upload.single("avatar");

const MULTIPART_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: "A foto de perfil deve ter no máximo 2MB.",
  LIMIT_FILE_COUNT: "Máximo de 1 arquivo por requisição.",
  LIMIT_UNEXPECTED_FILE: "Parte de arquivo inesperada na requisição.",
};

export function uploadAvatar(req: Request, res: Response, next: NextFunction): void {
  single(req, res, (err) => {
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
