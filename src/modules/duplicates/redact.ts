import {
  buildCompletedRequestTemplate,
  COMPLETED_REQUEST_REDACTION_VERSION,
  COMPLETED_REQUEST_TEMPLATE_VERSION,
} from "./template.ts";

/**
 * Gate de PII do texto de Solicitações concluídas no corpus de duplicidade
 * (issue #210; regras em `docs/rules/duplicate-detection.md`).
 *
 * É um gate, não mascaramento parcial: se qualquer padrão casar no título ou no
 * resumo, os dois campos caem para o template de concluída e o texto bruto
 * nunca é publicado. Nomes sem contexto podem passar; por isso a flag nasce
 * desligada e o canário de RN04 é obrigatório.
 *
 * O gate é conservador por desenho: CPF/CNPJ são detectados pelo formato, sem
 * validar dígito verificador. Um número inválido digitado por engano continua
 * sendo PII e não pode escapar.
 */
const PII_PATTERNS: readonly RegExp[] = [
  // E-mail.
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  // CPF com separadores opcionais, inclusive duplos ("123.456.789 - 00").
  /\b\d{3}\s*[./-]?\s*\d{3}\s*[./-]?\s*\d{3}\s*[./-]?\s*\d{2}\b/,
  // CNPJ numérico ou alfanumérico ("12.ABC.345/01DE-35"), com separadores
  // opcionais; os dois dígitos finais continuam numéricos.
  /\b[A-Z0-9]{2}\s*[./-]?\s*[A-Z0-9]{3}\s*[./-]?\s*[A-Z0-9]{3}\s*[./-]?\s*[A-Z0-9]{4}\s*[./-]?\s*\d{2}\b/i,
  // Telefone com DDD e +55 opcional ("(11) 99999 - 8888").
  /(?<!\d)\(?\d{2}\)?\s*9?\d{4}\s*[.-]?\s*\d{4}\b/,
  // Celular de 9 dígitos sem DDD ("99999-8888").
  /(?<!\d)9\d{4}\s*[.-]?\s*\d{4}\b/,
  // RG canônico, com dígito verificador numérico ou X.
  /\b\d{1,2}(?:\s*[.-]\s*|\s+)\d{3}(?:\s*[.-]\s*|\s+)\d{3}(?:\s*[.-]\s*|\s+)[\dXx]\b/,
  // RG de 8 dígitos só com contexto explícito, para não casar valores como
  // "R$ 1.500.000" ou "2.000.000 de registros".
  /\bRG\s*:?\s*\d{1,2}\s*[.-]?\s*\d{3}\s*[.-]?\s*\d{3}\s*[.-]?\s*[\dXx]?\b/i,
  // CEP com separadores opcionais.
  /\b\d{5}\s*[.-]?\s*\d{3}\b/,
  // Placa antiga e Mercosul em formato canônico. A variante com espaço exige
  // contexto; sem isso, "no ano 2026" e "com 2026 clientes" cairiam no gate.
  /\b[A-Z]{3}-?\d{4}\b/,
  /\b[A-Z]{3}-?\d[A-Z]\d{2}\b/,
  /\b(?:placa|ve[íi]culo)\s*:?\s*[A-Z]{3}\s\d{4}\b/i,
  // Sequência longa de dígitos (CPF/CNPJ/CEP/telefone sem máscara etc.).
  /\b\d{7,}\b/,
];

/** `true` quando o texto contém qualquer padrão de PII do gate. */
export function containsPersonalData(text: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(text));
}

export interface CompletedProjectionText {
  title: string;
  summary: string;
  redactionVersion: string;
}

export interface CompletedProjectionTextInput {
  title: string;
  description: string;
  problem: string;
  category: string;
  createdAt: Date | string;
}

/**
 * Monta o texto público de uma Solicitação concluída. O resumo é a descrição
 * seguida do problema; se o gate de PII casar em qualquer um dos campos ou se
 * título/resumo ficarem vazios após `trim()`, usa o template de concluída.
 */
export function buildCompletedProjectionText(
  input: CompletedProjectionTextInput,
): CompletedProjectionText {
  const title = input.title.trim();
  const summary = [input.description.trim(), input.problem.trim()]
    .filter((part) => part.length > 0)
    .join("\n\n");

  if (
    title.length === 0 ||
    summary.length === 0 ||
    containsPersonalData(title) ||
    containsPersonalData(summary)
  ) {
    const template = buildCompletedRequestTemplate({
      category: input.category,
      createdAt: input.createdAt,
    });

    return {
      title: template.title,
      summary: template.summary,
      redactionVersion: COMPLETED_REQUEST_TEMPLATE_VERSION,
    };
  }

  return {
    title,
    summary,
    redactionVersion: COMPLETED_REQUEST_REDACTION_VERSION,
  };
}
