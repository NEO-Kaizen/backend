import type { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";

export const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

export const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;
const MAX_FIELD_SIZE_BYTES = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_ATTACHMENT_COUNT,
    fieldSize: MAX_FIELD_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    // MIME declarado pelo cliente não basta: um `.html` com
    // `application/pdf` seria servido depois em `/uploads`. Valida a extensão
    // contra a mesma lista de formatos aceitos.
    if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(extension)) {
      cb(
        new AppError("Formato de arquivo não permitido. Aceitos: PDF, DOCX, XLSX, PNG e JPG.", 400),
      );
      return;
    }
    cb(null, true);
  },
});

const multerFields = upload.fields([
  { name: "payload", maxCount: 1 },
  { name: "attachments", maxCount: MAX_ATTACHMENT_COUNT },
]);

// Mapeia erros do multer para o envelope 400 do contrato
// (LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE).
const MULTIPART_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: "Cada anexo deve ter no máximo 10MB.",
  LIMIT_FILE_COUNT: "Máximo de 5 anexos por solicitação.",
  LIMIT_UNEXPECTED_FILE: "Parte de arquivo inesperada na requisição.",
};

export function uploadFields(req: Request, res: Response, next: NextFunction): void {
  multerFields(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof MulterError) {
      next(
        new AppError(
          MULTIPART_ERROR_MESSAGES[err.code] ?? "Erro ao processar o upload dos anexos.",
          400,
        ),
      );
      return;
    }
    next(err);
  });
}
