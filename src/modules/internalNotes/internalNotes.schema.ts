import { z } from "zod";

export const protocolParamsSchema = z.object({
  protocol: z.string().trim().min(1, "Protocolo é obrigatório."),
});

export const createInternalNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "A observação não pode estar vazia.")
    .max(4000, "A observação deve ter no máximo 4000 caracteres."),
});

export const markInternalNotesReadSchema = z.object({
  lastReadNoteId: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, "Identificador da observação inválido."),
});

export const cursorPayloadSchema = z
  .object({
    t: z.iso.datetime({ offset: true }),
    type: z.enum(["note", "event"]),
    id: z.string(),
  })
  .superRefine((cursor, ctx) => {
    const pattern = cursor.type === "note" ? /^[1-9]\d*$/ : /^audit:[1-9]\d*$/;
    if (!pattern.test(cursor.id)) {
      ctx.addIssue({ code: "custom", path: ["id"], message: "Cursor inválido." });
    }
  });

export type TimelineCursorPayload = z.infer<typeof cursorPayloadSchema>;

export const listTimelineQuerySchema = z.object({
  limit: z.coerce
    .number("limit inválido.")
    .int("limit inválido.")
    .min(1, "limit deve estar entre 1 e 50.")
    .max(50, "limit deve estar entre 1 e 50.")
    .default(20),
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((raw, ctx): TimelineCursorPayload | undefined => {
      if (raw === undefined) {
        return undefined;
      }

      let decoded: unknown;
      try {
        decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
      } catch {
        ctx.addIssue({ code: "custom", message: "Cursor inválido." });
        return z.NEVER;
      }

      const payload = cursorPayloadSchema.safeParse(decoded);
      if (!payload.success) {
        ctx.addIssue({ code: "custom", message: "Cursor inválido." });
        return z.NEVER;
      }
      return payload.data;
    }),
});

export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;
