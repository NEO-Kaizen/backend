import { z } from "zod";
import { optionalString, requiredString } from "../../shared/validation/fieldSchemas.ts";
import type {
  ComplementaryBlock,
  DemandBlock,
  OperationalBlock,
  RequesterBlock,
} from "../../shared/types/requests.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";

const yesNoDetailSchema = z.union(
  [
    z.literal(false),
    z.string().trim().min(1, "Campo obrigatório.").max(1000, "Máximo de 1.000 caracteres."),
  ],
  {
    error: "Responda com 'false' (Não) ou informe o detalhamento em texto (máx. 1.000 caracteres).",
  },
);

const requesterSchema = z.object({
  fullName: requiredString(150),
  corporateEmail: z.email("Informe um e-mail válido.").max(254, "Máximo de 254 caracteres."),
  area: requiredString(100),
  department: optionalString(100),
  manager: requiredString(150),
  additionalContact: optionalString(100),
}) satisfies z.ZodType<RequesterBlock>;

const demandSchema = z.object({
  title: requiredString(150),
  requestType: requiredString(80),
  category: requiredString(80),
  processName: requiredString(150),
  description: requiredString(4000),
  problem: requiredString(4000),
  expectedResult: requiredString(4000),
  justification: requiredString(4000),
}) satisfies z.ZodType<DemandBlock>;

const operationalSchema = z.object({
  processDescription: requiredString(4000),
  processSteps: requiredString(4000),
  systemsUsed: requiredString(255),
  executionFrequency: requiredString(50),
  volumetry: requiredString(100),
  peopleInvolved: z
    .number()
    .int("Deve ser um número inteiro.")
    .positive("Deve ser maior que zero."),
  averageExecutionTime: requiredString(60),
  monthlyEffortHours: z
    .number()
    .min(0, "Não pode ser negativo.")
    .max(99999999.99, "Máximo de 99.999.999,99."),
  hasManualControls: yesNoDetailSchema,
  mainRisks: requiredString(2000),
  clientImpact: requiredString(2000),
  operationalImpact: z.enum(["Baixo", "Médio", "Alto", "Crítico"], {
    error: "Impacto operacional inválido — opções: Baixo, Médio, Alto ou Crítico.",
  }),
  desiredDeadline: z.iso.date("Data inválida — use o formato AAAA-MM-DD."),
  perceivedCriticality: z.enum(["Baixa", "Média", "Alta", "Crítica"], {
    error: "Criticidade inválida — opções: Baixa, Média, Alta ou Crítica.",
  }),
}) satisfies z.ZodType<OperationalBlock>;

const complementarySchema = z.object({
  hasProcessDocumentation: yesNoDetailSchema.optional(),
  hasSimilarSolution: yesNoDetailSchema.optional(),
  dependsOnOtherAreas: yesNoDetailSchema.optional(),
  handlesRestrictedInfo: yesNoDetailSchema.optional(),
  additionalNotes: optionalString(2000),
}) satisfies z.ZodType<ComplementaryBlock>;

const isRealCalendarDateTime = (value: string): boolean => {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  const [hour = 0, minute = 0] = (timePart ?? "00:00").split(":").map(Number);
  if (!year || !month || !day) return false;
  if (hour > 23 || minute > 59) return false;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= lastDay;
};

export const createRequestPayloadSchema = z.object(
  {
    requester: requesterSchema,
    demand: demandSchema,
    operational: operationalSchema,
    complementary: complementarySchema.optional(),
    schedulePreferences: z
      .array(
        z
          .string()
          .regex(
            /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/,
            "Horário inválido — use o formato AAAA-MM-DDTHH:MM.",
          )
          .refine(isRealCalendarDateTime, "Horário inexistente no calendário."),
      )
      .min(1, "Selecione pelo menos 1 opção de horário.")
      .max(3, "Máximo de 3 opções de horário.")
      .refine(
        (preferences) => new Set(preferences).size === preferences.length,
        "Horários duplicados não são permitidos.",
      )
      .optional(),
  },
  {
    error: "O payload deve ser um objeto JSON com os blocos requester, demand e operational.",
  },
) satisfies z.ZodType<CreateRequestPayload>;
