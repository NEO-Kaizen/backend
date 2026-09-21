import multer from "multer";
import { AppError } from "../../shared/errors/AppError.ts";

/**
 * Multer para upload de avatar de perfil (Issue #125).
 *
 * Reutiliza a configuração de asset do portal para um único arquivo
 * JPEG/PNG de até 2 MB. Campo esperado: `avatar`. Erros mapeiam para
 * o envelope 400/415 (consistência com `POST /requests`).
 */
const avatarRules = {
  mimes: new Set(["image/jpeg", "image/png"]),
  exts: new Set([".jpg", ".jpeg", ".png"]),
  maxBytes: 2 * 1024 * 1024,
};

export const uploadAvatar = upload.single("avatar");
