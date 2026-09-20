import { z } from "zod";

export interface TriageAssessment {
  id?: string;
  adherentToScope: "Sim" | "Não" | "";
  adherentJustification: string;
  changeCategory: "Sim" | "Não" | "";
  newCategory: string;
  preliminaryComplexity: string;
  perceivedRisks: string;
  suggestedResponsible: string;
  suggestedResponsibleJustification: string;
  exitStatus: string;
  result: string;
  conclusionJustification: string;
}

export type CreateTriagePayload = Omit<TriageAssessment, "id">;

const triageChoice = z.union([
  z.literal("Sim"),
  z.literal("Não"),
  z.literal(""),
]);

const dbIdentifierOrEmpty = z.union([
  z.literal(""),
  z.number().int("Identificador inválido.").positive("Identificador inválido."),
  z.string().trim().min(1, "Identificador inválido.").max(255, "Identificador inválido."),
]).transform((value) => (typeof value === "number" ? String(value) : value));

const textField = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max.toLocaleString("pt-BR")} caracteres.`)
    .default("");

export const createTriagePayloadSchema = z
  .object({
    adherentToScope: triageChoice,
    adherentJustification: textField(1000),
    changeCategory: triageChoice,
    newCategory: dbIdentifierOrEmpty.default(""),
    preliminaryComplexity: textField(4000),
    perceivedRisks: textField(4000),
    suggestedResponsible: textField(150),
    suggestedResponsibleJustification: textField(1000),
    exitStatus: z.union([
      z.number().int("Status de saída inválido.").positive("Status de saída inválido."),
      z.string().trim().min(1, "Selecione o status de saída").max(255, "Status de saída inválido."),
    ]).transform((value) => String(value)),
    result: z.string().trim().min(1, "Informe o resultado da triagem").max(1000, "Máximo de 1.000 caracteres."),
    conclusionJustification: z
      .string()
      .trim()
      .min(1, "Informe a justificativa final")
      .max(4000, "Máximo de 4.000 caracteres."),
  })
  .superRefine((value, ctx) => {
    if (value.adherentToScope === "Não" && value.adherentJustification.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adherentJustification"],
        message: "Informe a justificativa quando não aderente ao escopo",
      });
    }

    if (value.changeCategory === "Sim" && value.newCategory.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newCategory"],
        message: "Selecione a categoria de destino",
      });
    }

    if (value.adherentToScope === "Sim" && value.preliminaryComplexity.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preliminaryComplexity"],
        message: "Descreva a complexidade preliminar",
      });
    }

    if (value.adherentToScope === "Sim" && value.perceivedRisks.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["perceivedRisks"],
        message: "Descreva os riscos percebidos",
      });
    }

    if (value.changeCategory !== "Sim") {
      value.newCategory = "";
    }

    if (value.adherentToScope !== "Não") {
      value.adherentJustification = "";
    }
  });
