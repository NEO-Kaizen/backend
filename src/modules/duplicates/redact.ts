import { buildCompletedRequestTemplate, COMPLETED_REQUEST_REDACTION_VERSION } from "./template.ts";

/**
 * Gate de PII do texto de Solicitações concluídas no corpus de duplicidade
 * (issue #210; regras em `docs/rules/duplicate-detection.md`).
 *
 * É um gate, não mascaramento parcial: se qualquer padrão casar no título ou no
 * resumo, os dois campos caem para o template de concluída e o texto bruto
 * nunca é publicado. Nomes sem contexto podem passar; por isso a flag nasce
 * desligada e o canário de RN04 é obrigatório.
 */
const PII_PATTERNS: readonly RegExp[] = [
  // E-mail.
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  // CPF com separadores opcionais (ponto, hífen ou espaço).
  /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}\b/,
  // CNPJ com separadores opcionais (ponto, barra, hífen ou espaço).
  /\b\d{2}[\s./-]?\d{3}[\s./-]?\d{3}[\s./-]?\d{4}[\s./-]?\d{2}\b/,
  // Telefone brasileiro com DDD opcional e +55 opcional.
  /(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}\b/,
  // RG canônico, com dígito verificador numérico ou X.
  /\b\d{1,2}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?[\dXx]\b/,
  // RG de 8 dígitos sem dígito verificador.
  /\b\d{1,2}[\s.-]?\d{3}[\s.-]?\d{3}\b/,
  // CEP com separadores opcionais.
  /\b\d{5}[\s.-]?\d{3}\b/,
  // Placa antiga e Mercosul, com separadores opcionais.
  /\b[A-Z]{3}[\s.-]?\d{4}\b|\b[A-Z]{3}[\s.-]?\d[\s.-]?[A-Z][\s.-]?\d{2}\b/i,
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
 * seguida do problema; se o gate de PII casar em qualquer um dos campos, usa o
 * template de concluída.
 */
export function buildCompletedProjectionText(
  input: CompletedProjectionTextInput,
): CompletedProjectionText {
  const title = input.title.trim();
  const summary = [input.description.trim(), input.problem.trim()]
    .filter((part) => part.length > 0)
    .join("\n\n");

  if (containsPersonalData(title) || containsPersonalData(summary)) {
    const template = buildCompletedRequestTemplate({
      category: input.category,
      createdAt: input.createdAt,
    });

    return {
      title: template.title,
      summary: template.summary,
      redactionVersion: COMPLETED_REQUEST_REDACTION_VERSION,
    };
  }

  return {
    title,
    summary,
    redactionVersion: COMPLETED_REQUEST_REDACTION_VERSION,
  };
}
