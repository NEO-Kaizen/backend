import { z } from "zod";

export const createPendingItemsSchema = z
  .object({
    observation: z.string().trim().min(1).max(2000).optional(),
    requestAttachment: z.boolean().optional().default(false),
    items: z
      .array(
        z.object({
          fieldKey: z.string().trim().min(1),
          comment: z.string().trim().min(1, "comment vazio").max(2000),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const hasObservation =
      typeof data.observation === "string" && data.observation.trim().length > 0;
    const hasItems = Array.isArray(data.items) && data.items.length > 0;
    if (!hasObservation && !hasItems) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pelo menos um de observation ou items deve ser informado",
        path: ["observation"],
      });
    }
  });

export const verifySchema = z.object({
  name: z.string().trim().min(3).max(150),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254),
  protocol: z.string().trim().min(1),
});

export const reviewSchema = z.object({
  batchId: z.string().trim().min(1),
  requestAttachment: z.boolean().optional(),
  items: z
    .array(
      z.discriminatedUnion("decision", [
        z.object({
          id: z.string().trim().min(1),
          decision: z.literal("validate"),
          note: z.string().trim().max(2000).optional(),
        }),
        z.object({
          id: z.string().trim().min(1),
          decision: z.literal("reopen"),
          comment: z.string().trim().min(1, "comment vazio").max(2000),
        }),
      ]),
    )
    .min(1),
});

export type CreatePendingItemsInput = z.infer<typeof createPendingItemsSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
