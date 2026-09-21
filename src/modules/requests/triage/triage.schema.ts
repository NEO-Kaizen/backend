import { z } from "zod";

export interface TriageAssessment {
  id: string; // uuid v4 do registro — gerado pelo backend no POST (contract-triage_04.md §1)
  adherentToScope: "Sim" | "Não" | "";
  adherentJustification: string;
  changeCategory: "Sim" | "Não" | "";
  newCategory: string; // name-string validado contra o cadastro ativo (ver TODO do contrato §Tipos)
  preliminaryComplexity: string;
  perceivedRisks: string;
  suggestedResponsible: string;
  suggestedResponsibleJustification: string;
  exitStatus: number; // PortalStatus.id — deve ter isTriageExit && isActive
  result: string;
  conclusionJustification: string;
}

export type CreateTriagePayload = Omit<TriageAssessment, "id">;

const triageChoice = z.union([z.literal("Sim"), z.literal("Não"), z.literal("")]);

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
    // name-string do cadastro ativo (contrato §Tipos + TODO) — nunca id.
    newCategory: z.string().trim().max(40, "Máximo de 40 caracteres.").default(""),
    preliminaryComplexity: textField(4000),
    perceivedRisks: textField(4000),
    suggestedResponsible: textField(150),
    suggestedResponsibleJustification: textField(1000),
    // PortalStatus.id numérico — literais antigos (nomes) não são aceitos
    // (contrato §Observações: "Backend não aceita literais antigos").
    exitStatus: z
      .number("Selecione o status de saída")
      .int("Status de saída inválido.")
      .positive("Status de saída inválido."),
    result: z
      .string()
      .trim()
      .min(1, "Informe o resultado da triagem")
      .max(1000, "Máximo de 1.000 caracteres."),
    conclusionJustification: z
      .string()
      .trim()
      .min(1, "Informe a justificativa final")
      .max(4000, "Máximo de 4.000 caracteres."),
  })
  .superRefine((value, ctx) => {
    if (value.adherentToScope === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adherentToScope"],
        message: "Informe se a demanda é aderente ao escopo",
      });
    }

    if (value.changeCategory === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["changeCategory"],
        message: "Informe se houve troca de categoria",
      });
    }

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
