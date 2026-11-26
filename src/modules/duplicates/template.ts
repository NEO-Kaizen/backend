import { toSaoPauloDateOnly } from "../../shared/utils/date.ts";

/**
 * Template materializado de uma Solicitação aberta no corpus de duplicidade
 * (issue #209; regras em `docs/rules/duplicate-detection.md`).
 *
 * Uma aberta NUNCA publica título, descrição, problema, resultado esperado ou
 * justificativa livres: apenas Categoria, Status "Em andamento" e o trimestre
 * de criação no fuso America/Sao_Paulo.
 */
export const OPEN_REQUEST_PUBLIC_STATUS = "Em andamento";
export const OPEN_REQUEST_REDACTION_VERSION = "v1-open-template";
export const COMPLETED_REQUEST_PUBLIC_STATUS = "Concluída";
/** Texto livre de concluída que passou pelo gate de PII. */
export const COMPLETED_REQUEST_REDACTION_VERSION = "v1-regex";
/** Fallback de PII/texto vazio e qualquer linha de concluída suprimida. */
export const COMPLETED_REQUEST_TEMPLATE_VERSION = "v1-template";

/**
 * Tradução única de cada campo do template para a coluna do snapshot público.
 * O mapa também define os campos válidos: a materialização em TS usa o valor e
 * a expressão SQL da supressão usa a coluna.
 */
export const COMPLETED_TEMPLATE_COLUMNS = {
  category: "public_category",
  period: "public_period",
} as const;

export type CompletedTemplateField = keyof typeof COMPLETED_TEMPLATE_COLUMNS;

/**
 * Partes do template de concluída compartilhadas entre a materialização em TS
 * e o SQL da supressão em massa. As listas abaixo são a fonte única da
 * estrutura e da ordem; o repository só traduz `field` para a coluna.
 */
export type CompletedTemplatePart =
  { readonly literal: string } | { readonly field: CompletedTemplateField };

export const COMPLETED_TITLE_TEMPLATE = [
  { literal: "Solicitação de " },
  { field: "category" },
  { literal: " concluída" },
] as const satisfies readonly CompletedTemplatePart[];

export const COMPLETED_SUMMARY_TEMPLATE = [
  { literal: "Solicitação concluída da categoria " },
  { field: "category" },
  { literal: ", registrada no período " },
  { field: "period" },
  { literal: "." },
] as const satisfies readonly CompletedTemplatePart[];

export interface PublicRequestTemplate {
  title: string;
  summary: string;
  category: string;
  status: string;
  period: string;
  redactionVersion: string;
}

function materializeCompletedTemplate(
  parts: readonly CompletedTemplatePart[],
  values: Record<CompletedTemplateField, string>,
): string {
  return parts.map((part) => ("field" in part ? values[part.field] : part.literal)).join("");
}

/**
 * Trimestre de `created_at` no fuso America/Sao_Paulo, no formato `YYYY-Qn`.
 * O trimestre é calculado a partir da data local de São Paulo, não do UTC.
 */
export function toSaoPauloQuarter(value: unknown): string {
  const dateOnly = toSaoPauloDateOnly(value);

  if (!dateOnly) {
    throw new Error("Data inválida para o período da projeção pública.");
  }

  const [yearPart, monthPart] = dateOnly.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Data inválida para o período da projeção pública.");
  }

  return `${year}-Q${Math.ceil(month / 3)}`;
}

export function buildOpenRequestTemplate(input: {
  category: string;
  createdAt: Date | string;
}): PublicRequestTemplate {
  const period = toSaoPauloQuarter(input.createdAt);

  return {
    title: `Solicitação de ${input.category} em andamento`,
    summary: `Solicitação em andamento da categoria ${input.category}, registrada no período ${period}.`,
    category: input.category,
    status: OPEN_REQUEST_PUBLIC_STATUS,
    period,
    redactionVersion: OPEN_REQUEST_REDACTION_VERSION,
  };
}

/**
 * Template de fallback de uma Solicitação concluída (issue #210): usado quando
 * o texto livre não passa no gate de PII, fica vazio ou quando a linha está
 * suprimida.
 */
export function buildCompletedRequestTemplate(input: {
  category: string;
  createdAt: Date | string;
}): PublicRequestTemplate {
  const period = toSaoPauloQuarter(input.createdAt);
  const values = { category: input.category, period };

  return {
    title: materializeCompletedTemplate(COMPLETED_TITLE_TEMPLATE, values),
    summary: materializeCompletedTemplate(COMPLETED_SUMMARY_TEMPLATE, values),
    category: input.category,
    status: COMPLETED_REQUEST_PUBLIC_STATUS,
    period,
    redactionVersion: COMPLETED_REQUEST_TEMPLATE_VERSION,
  };
}
