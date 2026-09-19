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
