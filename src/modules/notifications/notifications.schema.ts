import { z } from "zod";

export const notificationIdSchema = z.string().uuid("notificationId deve ser um UUID.");

const CURSOR_SEPARATOR = "|";

export const notificationCursorPayloadSchema = z.object({
  t: z.iso.datetime({ offset: true }),
  id: notificationIdSchema,
});

export type NotificationCursorPayload = z.infer<typeof notificationCursorPayloadSchema>;

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("Deve ser um número inteiro.")
    .positive("Deve ser maior que zero.")
    .max(50, "Máximo de 50 itens por página.")
    .default(20),
  cursor: z
    .string()
    .trim()
    .max(512, "Máximo de 512 caracteres.")
    .optional()
    .transform((raw, ctx): NotificationCursorPayload | undefined => {
      if (raw === undefined || raw === "") {
        return undefined;
      }

      let decoded: unknown;

      try {
        const text = Buffer.from(raw, "base64url").toString("utf8");
        const separatorIndex = text.indexOf(CURSOR_SEPARATOR);

        if (separatorIndex <= 0) {
          throw new Error("cursor inválido");
        }

        decoded = {
          t: text.slice(0, separatorIndex),
          id: text.slice(separatorIndex + 1),
        };
      } catch {
        ctx.addIssue({ code: "custom", message: "Cursor inválido." });
        return z.NEVER;
      }

      const payload = notificationCursorPayloadSchema.safeParse(decoded);

      if (!payload.success) {
        ctx.addIssue({ code: "custom", message: "Cursor inválido." });
        return z.NEVER;
      }

      return payload.data;
    }),
});

export const notificationIdParamSchema = z.object({
  notificationId: notificationIdSchema,
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
