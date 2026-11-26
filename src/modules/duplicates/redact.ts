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
  // CPF com máscara. O CPF sem máscara é coberto pela sequência longa.
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/,
  // CNPJ com máscara. O CNPJ sem máscara é coberto pela sequência longa.
  /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/,
  // Telefone brasileiro com DDD opcional e +55 opcional.
  /(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}\b/,
  // RG com máscara (o dígito verificador pode ser X).
  /\b\d{1,2}\.\d{3}\.\d{3}-?[\dXx]\b/,
  // CEP com máscara. O CEP sem máscara é coberto pela sequência longa.
  /\b\d{5}-\d{3}\b/,
  // Placa antiga e Mercosul, com ou sem hífen.
  /\b[A-Z]{3}-?\d{4}\b|\b[A-Z]{3}\d[A-Z]\d{2}\b/i,
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
  usedFallback: boolean;
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
      usedFallback: true,
    };
  }

  return {
    title,
    summary,
    redactionVersion: COMPLETED_REQUEST_REDACTION_VERSION,
    usedFallback: false,
  };
}
