import { z } from "zod";
import {
  nullableOptionalString,
  optionalText,
  PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH,
  requiredText,
} from "../../../shared/validation/fieldSchemas.ts";

/**
 * Bloco requester aceito no "Meus dados". O service aplica a autorização:
 * somente o próprio Administrador pode alterar `area/department/manager`;
 * para os demais perfis, apenas `additionalContact` é autoeditável.
 * `additionalContact` aceita string, ""→null, null→clear, undefined/{}→no-op.
 */
export const updateRequesterSelfSchema = z
  .object({
    area: requiredText(100).optional(),
    department: z.union([optionalText(100), z.null()]).optional(),
    manager: requiredText(150).optional(),
    additionalContact: nullableOptionalString(PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH),
  })
  .strict();

/**
 * Bloco requester completo (admin / criação) — mantém `area/manager`
 * obrigatórios com charset `isValidText`.
 * `additionalContact` aceita null/"" para limpar.
 */
export const updateRequesterSchema = z.object({
  area: requiredText(100),
  department: optionalText(100),
  manager: requiredText(150),
  additionalContact: nullableOptionalString(PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH),
});

export type UpdateRequesterBlock = z.infer<typeof updateRequesterSchema>;

/**
 * Payload de `PUT /users/me` (multipart: campo `payload` = JSON).
 * - `fullName`? (atualiza o nome do próprio usuário)
 * - `requester`? (contato adicional; Administrador também pode atualizar seus
 *   próprios área, departamento e gestor)
 * - `removeAvatar`?: true → remove foto atual
 * - demais campos são recusados; dados administrativos pertencem a
 *   `PUT /users/:id`.
 */
export const updateProfileSchema = z
  .object({
    fullName: requiredText(150).optional(),
    requester: updateRequesterSelfSchema.optional(),
    removeAvatar: z.boolean().optional(),
  })
  .strict();

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
