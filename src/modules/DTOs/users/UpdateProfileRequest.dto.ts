import { z } from "zod";
import { optionalString, requiredString } from "../../../shared/validation/fieldSchemas.ts";
import { professionalSchema } from "../../users/users.schema.ts";

/**
 * Bloco requester editável no "Meus dados" — omite `fullName`/
 * `corporateEmail` (imutáveis por decisão de domínio).
 */
export const updateRequesterSchema = z.object({
  area: requiredString(100),
  department: optionalString(100),
  manager: requiredString(150),
  additionalContact: optionalString(100),
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
  requester: updateRequesterSchema.optional(),
  professional: professionalSchema.optional(),
  removeAvatar: z.boolean().optional(),
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
