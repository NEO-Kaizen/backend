import { z } from "zod";
import {
  emailSchema,
  nullableOptionalString,
  optionalText,
  requiredString,
  requiredText,
} from "../../shared/validation/fieldSchemas.ts";

/**
 * Dados profissionais de um usuário atribuível.
 * `capacity` e `status` nascem dos defaults do schema (5 / "active").
 */
export const professionalSchema = z.object({
  jobTitle: requiredString(100),
  specialties: z.array(requiredString(100)).min(1, "Informe ao menos uma especialidade."),
  attendedCategoryIds: z
    .array(z.number().int("Id inválido.").positive("Id inválido."))
    .min(1, "Selecione ao menos uma categoria atendida."),
  notes: z.string().trim().max(500, "Máximo de 500 caracteres.").optional(),
});

export const requesterSchema = z.object({
  area: requiredText(100),
  department: optionalText(100),
  manager: requiredText(150),
  additionalContact: nullableOptionalString(100),
});

/** Identidade estável do Perfil — o nome mutável não identifica nem autoriza. */
const profileIdSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "Perfil inválido.")
  .max(10, "Perfil inválido.");

export const createUserSchema = z.object({
  fullName: requiredString(150),
  email: emailSchema,
  profileId: profileIdSchema,
  professional: professionalSchema.optional(),
  requester: requesterSchema,
});

export const listUsersQuerySchema = z
  .object({
    profileId: profileIdSchema.optional(),
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
  })
  // Filtro por nome (`?profile=`) foi removido na contração da issue #199:
  // ignorar o parâmetro devolveria a lista inteira sem o filtro esperado.
  .strict();

export const listAssignableProfessionalsQuerySchema = z.object({
  stage: z.enum(["triage", "mapping"]).default("triage"),
});

export const requesterPatchSchema = z.object({
  area: requiredText(100).optional(),
  department: z.union([optionalText(100), z.null()]).optional(),
  manager: requiredText(150).optional(),
  additionalContact: nullableOptionalString(100),
});

export const changeUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserSchema = z
  .object({
    fullName: requiredText(150).optional(),
    email: emailSchema.optional(),
    profileId: profileIdSchema.optional(),
    professional: professionalSchema.optional(),
    requester: requesterPatchSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "Informe ao menos um campo para atualização.",
      });
    }
  });
