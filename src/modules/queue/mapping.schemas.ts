// Validação do payload de `PUT /queue/requests/:protocol/mapping` (issue #86).
//
// Escopo do Zod aqui: forma, limites e duplicidade aparente (fail fast). A
// completude de campos (ex.: `meetingLink` obrigatório em `REMOTE`) depende
// do estado mesclado (merge com os valores persistidos) e é validada no
// service — o zod não enxerga o valor atual do mapeamento.
import { z } from "zod";
import { emailSchema, requiredString } from "../../shared/validation/fieldSchemas.ts";
import type { MappingParticipantInput, MappingPayloadDTO } from "../DTOs/queue/mapping.dto.ts";

/**
 * `id` do participante referencia `users.user_id` (int). Aceita número ou
 * string numérica e normaliza para string (mesmo padrão do `MeResponseDTO.id`).
 * `null` também é aceito e normalizado para ausente: a RESPOSTA devolve
 * `id: null` para participante externo — ecoá-la de volta ao `PUT` deve
 * produzir um externo novamente, sem quebrar o roundtrip.
 * O refine pré-transform unifica o critério das entradas (rejeita `0`/`"0"`)
 * sem avaliar `null`.
 */
const participantIdSchema = z
  .union([
    z
      .number()
      .int("Identificador de participante inválido.")
      .positive("Identificador de participante inválido."),
    z.string().trim().regex(/^\d+$/, "Identificador de participante inválido."),
    z.null(),
  ])
  .refine(
    (value) => value === null || Number(value) >= 1,
    "Identificador de participante inválido.",
  )
  .transform((value) => (value === null ? undefined : String(value)));

const mappingParticipantSchema = z.object({
  id: participantIdSchema.optional(),
  name: requiredString(255),
  email: emailSchema,
}) satisfies z.ZodType<MappingParticipantInput>;

const noDuplicateParticipants = (participants: { id?: string; email: string }[]): boolean => {
  const seen = new Set<string>();

  for (const participant of participants) {
    // Com `id`, a unicidade é pela identidade cadastrada; sem `id`, pelo
    // e-mail (case-insensitive). O mesmo usuário informado por `id` e por
    // e-mail é rejeitado na resolução (service/repositório), após o merge.
    const key =
      participant.id !== undefined
        ? `id:${participant.id}`
        : `email:${participant.email.trim().toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }

  return true;
};

export const mappingPayloadSchema = z.object(
  {
    id: z.string().trim().uuid("Identificador do mapeamento inválido.").optional(),
    mappingAssigneeId: z
      .string()
      .trim()
      .uuid("Identificador do designado inválido.")
      .nullable()
      .optional(),
    scheduledFor: z.iso
      .datetime({
        offset: true,
        error: "Data/hora inválida — envie ISO-8601 com offset (ex.: 2026-10-15T10:30:00-03:00).",
      })
      .nullable()
      .optional(),
    durationMinutes: z
      .number()
      .int("Deve ser um número inteiro.")
      .min(15, "Mínimo de 15 minutos.")
      .max(480, "Máximo de 480 minutos.")
      .nullable()
      .optional(),
    modality: z
      .enum(["REMOTE", "IN_PERSON"], {
        error: "Modalidade inválida — opções: REMOTE ou IN_PERSON.",
      })
      .nullable()
      .optional(),
    meetingLink: z.string().trim().max(500, "Máximo de 500 caracteres.").nullable().optional(),
    location: z.string().trim().max(500, "Máximo de 500 caracteres.").nullable().optional(),
    notes: z.string().trim().max(2000, "Máximo de 2.000 caracteres.").nullable().optional(),
    participants: z
      .array(mappingParticipantSchema, { error: "Informe uma lista de participantes." })
      .max(20, "Máximo de 20 participantes.")
      .refine(noDuplicateParticipants, {
        message: "Participantes duplicados não são permitidos.",
        path: ["participants"],
      })
      .optional(),
    completeMapping: z.boolean("Informe completeMapping (true ou false)."),
  },
  {
    error: "O payload deve ser um objeto JSON com a chave completeMapping.",
  },
) satisfies z.ZodType<MappingPayloadDTO>;

export type MappingPayload = z.infer<typeof mappingPayloadSchema>;
