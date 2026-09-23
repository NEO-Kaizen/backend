import { z } from "zod";
import {
  optionalString,
  optionalText,
  PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH,
  requiredText,
} from "../../../shared/validation/fieldSchemas.ts";
import { professionalSchema } from "../../users/users.schema.ts";

/**
 * Bloco requester self-editável no "Meus dados" — após mudança para
 * admin-provisioned, só `additionalContact` é mutável pelo dono.
 * `area/department/manager` são admin-only (rejeitados no service).
 */
export const updateRequesterSelfSchema = z.object({
  additionalContact: optionalString(PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH),
});

/**
 * Bloco requester completo (admin / criação) — mantém `area/manager`
 * obrigatórios com charset `isValidText`.
 */
export const updateRequesterSchema = z.object({
  area: requiredText(100),
  department: optionalText(100),
  manager: requiredText(150),
  additionalContact: optionalString(PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH),
});

export type UpdateRequesterBlock = z.infer<typeof updateRequesterSchema>;

/**
 * Payload de `PUT /users/me` (multipart: campo `payload` = JSON).
 * - `requester`? (atualiza bloco de requester)
 * - `professional`? (atualiza bloco professional — 400 se perfil ≠ analista)
 * - `removeAvatar`?: true → remove foto atual
 * - campos `fullName`/`corporateEmail`/`role` são descartados (imutáveis)
 *
 * A restrição de `professional` ao perfil Analista é feita no service (tem
 * acesso ao `profile_name` do usuário; o schema não conhece o role).
 */
export const updateProfileSchema = z.object({
  requester: updateRequesterSelfSchema.optional(),
  professional: professionalSchema.optional(),
  removeAvatar: z.boolean().optional(),
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
