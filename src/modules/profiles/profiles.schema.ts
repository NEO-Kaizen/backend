import { z } from "zod";
import { CUSTODIES, PERMISSION_CATALOG } from "../../shared/catalog/permissionCatalog.ts";
import { nullableOptionalString, requiredString } from "../../shared/validation/fieldSchemas.ts";

/** Nome do Perfil — a unicidade case-insensitive entre ativos é regra de serviço. */
const profileNameSchema = requiredString(60);

/** Descrição opcional; `null` limpa (PATCH) e ausente/no vazio não grava. */
const profileDescriptionSchema = nullableOptionalString(255);

/** Item da composição: chave livre (validada contra o catálogo no service) + vínculo. */
export const profilePermissionSchema = z.object({
  key: z.string().trim().min(1, "Chave obrigatória.").max(60, "Máximo de 60 caracteres."),
  custody: z.enum(CUSTODIES, "Vínculo inválido."),
});

const profilePermissionsSchema = z
  .array(profilePermissionSchema)
  .max(PERMISSION_CATALOG.length, "A composição não pode exceder o catálogo de chaves.");

export const createProfileSchema = z.object({
  name: profileNameSchema,
  description: profileDescriptionSchema,
  isAssignableTriage: z.boolean().optional(),
  isAssignableMapping: z.boolean().optional(),
  permissions: profilePermissionsSchema,
});

export const updateProfileSchema = z
  .object({
    name: profileNameSchema.optional(),
    description: profileDescriptionSchema,
    isAssignableTriage: z.boolean().optional(),
    isAssignableMapping: z.boolean().optional(),
    permissions: profilePermissionsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasField =
      value.name !== undefined ||
      value.description !== undefined ||
      value.isAssignableTriage !== undefined ||
      value.isAssignableMapping !== undefined ||
      value.permissions !== undefined;

    if (!hasField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "Informe ao menos um campo para atualização.",
      });
    }
  });

export const changeProfileStatusSchema = z.object({
  isActive: z.boolean(),
});

export const duplicateProfileSchema = z.object({
  name: profileNameSchema,
  description: profileDescriptionSchema,
});
