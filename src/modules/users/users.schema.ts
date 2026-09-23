import { z } from "zod";
import {
  emailSchema,
  nullableOptionalString,
  optionalText,
  requiredString,
  requiredText,
} from "../../shared/validation/fieldSchemas.ts";

/**
 * Dados profissionais do analista — obrigatórios na criação do perfil.
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

/** Perfil elegível para a extensão de profissional — apenas analista. */
const PROFESSIONAL_ROLE = "analista";

export const requesterSchema = z.object({
  area: requiredText(100),
  department: optionalText(100),
  manager: requiredText(150),
  additionalContact: nullableOptionalString(100),
});

export const createUserSchema = z
  .object({
    fullName: requiredString(150),
    email: emailSchema,
    role: z.string().trim().min(1, "Campo obrigatório.").max(60, "Máximo de 60 caracteres."),
    professional: professionalSchema.optional(),
    requester: requesterSchema,
  })
  .superRefine((value, ctx) => {
    const isAnalyst = value.role.trim().toLowerCase() === PROFESSIONAL_ROLE;
    if (isAnalyst && !value.professional) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["professional"],
        message: "Dados profissionais são obrigatórios para o perfil Analista.",
      });
    }
    if (!isAnalyst && value.professional !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["professional"],
        message: "Dados profissionais são exclusivos do perfil Analista.",
      });
    }
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

export const requesterPatchSchema = z.object({
  area: requiredText(100).optional(),
  department: optionalText(100),
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
    role: z
      .string()
      .trim()
      .min(1, "Campo obrigatório.")
      .max(60, "Máximo de 60 caracteres.")
      .optional(),
    professional: professionalSchema.optional(),
    requester: requesterPatchSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role !== undefined) {
      const isAnalyst = value.role.trim().toLowerCase() === PROFESSIONAL_ROLE;
      if (isAnalyst && value.professional === undefined) {
        // Permitir merge sem reenviar professional se já existir — validação de presença só no service com acesso ao banco.
        // Schema apenas bloqueia professional em role não-analista.
      }
      if (!isAnalyst && value.professional !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["professional"],
          message: "Dados profissionais são exclusivos do perfil Analista.",
        });
      }
    } else if (value.professional !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["professional"],
        message: "Informe o campo role junto com professional.",
      });
    }
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "Informe ao menos um campo para atualização.",
      });
    }
  });
