import { z } from "zod";
import { emailSchema, requiredString } from "../../shared/validation/fieldSchemas.ts";

export const createRequesterSchema = z.object({
  fullName: requiredString(150),
  email: emailSchema,
});

export const listUsersQuerySchema = z.object({
  profile: z
    .string()
    .trim()
    .min(1, "Perfil inválido.")
    .max(60, "Máximo de 60 caracteres.")
    .optional(),
  search: z.string().trim().max(150, "Máximo de 150 caracteres.").optional(),
  page: z.coerce
    .number()
    .int("Deve ser um número inteiro.")
    .positive("Deve ser maior que zero.")
    .max(10000, "Máximo de 10000.")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("Deve ser um número inteiro.")
    .positive("Deve ser maior que zero.")
    .max(50, "Máximo de 50 itens por página.")
    .default(10),
});

export const changeUserStatusSchema = z.object({
  isActive: z.boolean(),
});
