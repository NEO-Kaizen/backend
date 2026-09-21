import express from "express";
import multer from "multer";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { requireRole } from "../../shared/middleware/requireRole.ts";
import { requesterDualAuth } from "../../shared/middleware/dualAuth.ts";
import {
  createPendingItems,
  listPendingItems,
  respondPendingItem,
  attachPendingItem,
  reviewPendingItems,
  publicVerify,
} from "./pendingItems.controller.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { ALLOWED_MIMES, MAX_FILE_SIZE_BYTES } from "../../shared/middleware/upload.ts";

const router = express.Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      cb(
        new AppError("Formato de arquivo não permitido. Aceitos: PDF, DOCX, XLSX, PNG e JPG.", 400),
      );
      return;
    }
    cb(null, true);
  },
});

const uploadSingle = upload.single("file");

// rotas de pendência: :protocol no mergeParams do mount /requests/:protocol/pending-items
router.post(
  "/",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  createPendingItems,
);
router.get("/", requesterDualAuth, listPendingItems);
router.patch(
  "/review",
  authMiddleware,
  requireRole("Analista", "Gestor", "Administrador"),
  reviewPendingItems,
);
router.patch("/:pendingItemId", requesterDualAuth, respondPendingItem);
router.post(
  "/:pendingItemId/attachments",
  requesterDualAuth,
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") {
          next(new AppError("Cada anexo deve ter no máximo 10MB.", 400));
          return;
        }
        next(err);
        return;
      }
      next();
    });
  },
  attachPendingItem,
);

export const publicVerifyRouter = express.Router({ mergeParams: true });
publicVerifyRouter.post("/verify", publicVerify);

export default router;
