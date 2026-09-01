import { z } from "zod";
import { optionalString, requiredString } from "../../shared/validation/fieldSchemas.ts";
import type {
  ComplementaryBlock,
  DemandBlock,
  OperationalBlock,
  RequesterBlock,
} from "../../shared/types/requests.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";

// Resposta "Sim/Não (+ detalhamento)" — o detalhamento É a resposta positiva:
// dizer "Sim" sem escrever o detalhe é estruturalmente impossível.
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
  category: z.enum(
    [
      "Automação",
      "Melhoria de processo",
      "Indicador",
      "Dashboard ou relatório",
      "Análise de dados",
      "Padronização",
      "Revisão de processo",
      "Apoio técnico",
      "Estudo de viabilidade",
      "Outros",
    ],
    { error: "Categoria inválida — selecione uma opção da lista." },
  ),
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
    .number("Deve ser um número.")
    .int("Deve ser um número inteiro.")
    .positive("Deve ser maior que zero."),
  averageExecutionTime: requiredString(60),
  monthlyEffortHours: z.number("Deve ser um número."),
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
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
            "Horário inválido — use o formato AAAA-MM-DDTHH:MM.",
          ),
      )
      .max(3, "Máximo de 3 opções de horário.")
      .optional(),
  },
  {
    error: "O payload deve ser um objeto JSON com os blocos requester, demand e operational.",
  },
) satisfies z.ZodType<CreateRequestPayload>;
