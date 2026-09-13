import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import Config from "../../configs.ts";

export interface SavedAttachment {
  fileName: string; // nome original do arquivo
  mimeType: string; // MIME detectado no upload
  sizeBytes: number; // tamanho em bytes
  storageKey: string; // chave relativa persistida no banco (basename)
  storagePath: string; // caminho absoluto em disco — uso interno, nunca exposto na API
}

export async function saveFiles(
  // Ponto de melhoria: criptografar os arquivos
  files: Express.Multer.File[],
  targetDir: string = Config.UPLOAD_DIR,
): Promise<SavedAttachment[]> {
  if (files.length === 0) return [];

  const dir = path.resolve(targetDir);
  await fs.promises.mkdir(dir, { recursive: true });

  const saved: SavedAttachment[] = [];
  try {
    for (const file of files) {
      const filename = `${randomUUID()}${path.extname(file.originalname)}`;
      const storagePath = path.join(dir, filename);
      await fs.promises.writeFile(storagePath, file.buffer);
      saved.push({
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: filename,
        storagePath,
      });
    }
  } catch (err) {
    await removeFiles(saved);
    throw err;
  }

  return saved;
}

export async function removeFiles(saved: SavedAttachment[]): Promise<void> {
  await Promise.allSettled(
    saved.map((attachment) => fs.promises.rm(attachment.storagePath, { force: true })),
  );
}
