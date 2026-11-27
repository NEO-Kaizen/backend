/**
 * Descrição de uma falha para log de borda, sem SQL, nome de tabela ou PII.
 *
 * O CLI do backfill é a única borda que loga a causa de um erro. A mensagem
 * original do driver pode conter a query, identificadores e valores de
 * bindings; este sanitizador preserva o nome, o código e a causa útil, mas
 * remove o que não pode entrar em log (CODING_STANDARDS §5 e §8).
 */
const MAX_DESCRIPTION_LENGTH = 300;

const SQL_STATEMENT_PATTERNS: readonly RegExp[] = [
  /\bselect\b[\s\S]*?\bfrom\b[\s\S]*/i,
  /\binsert\s+into\b[\s\S]*/i,
  /\bupdate\s+\S+\s+set\b[\s\S]*/i,
  /\bdelete\s+from\b[\s\S]*/i,
  /\b(?:alter|create|drop|truncate)\s+(?:table|index|schema|database)\b[\s\S]*/i,
];

const REDACTION_PATTERNS: readonly (readonly [RegExp, string])[] = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]"],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[id]"],
  [/\b\d[\d.\-/ ]{5,}\d\b/g, "[numero]"],
  [/"[^"]*"/g, "[identificador]"],
  [/'[^']*'/g, "[valor]"],
  [
    /\b(?:requests|request_public_projections|audit_history|system_settings|statuses|categories|users)\b/gi,
    "[tabela]",
  ],
];

interface FailureDetails {
  name: string;
  code?: string;
  message: string;
}

function readCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const { code } = value as { code?: unknown };
  return typeof code === "string" || typeof code === "number" ? String(code) : undefined;
}

function extractFailureDetails(error: unknown): FailureDetails | null {
  if (error instanceof Error) {
    return { name: error.name, code: readCode(error), message: error.message };
  }

  if (typeof error === "string") {
    return { name: "erro", message: error };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : null;
    const name = typeof record.name === "string" ? record.name : "erro";
    const code = readCode(error);

    if (message !== null) return { name, code, message };
    if (code) return { name, code, message: "" };
  }

  return null;
}

function sanitizeMessage(message: string): string {
  let sanitized = message.replace(/\s+/g, " ").trim();
  if (!sanitized) return "";

  const separatorIndex = sanitized.lastIndexOf(" - ");
  if (separatorIndex !== -1) {
    const head = sanitized.slice(0, separatorIndex);
    const tail = sanitized.slice(separatorIndex + 3).trim();

    if (tail && SQL_STATEMENT_PATTERNS.some((pattern) => pattern.test(head))) {
      sanitized = tail;
    }
  }

  for (const pattern of SQL_STATEMENT_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[sql omitido]");
  }

  for (const [pattern, replacement] of REDACTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized.length > MAX_DESCRIPTION_LENGTH
    ? `${sanitized.slice(0, MAX_DESCRIPTION_LENGTH - 3)}...`
    : sanitized;
}

/**
 * Monta a linha de log da falha. Aceita `Error`, string lançada e objetos
 * error-like (por exemplo, o erro cru do driver) sem descartar a causa.
 */
export function describeFailure(error: unknown): string {
  const details = extractFailureDetails(error);

  if (!details) {
    if (typeof error === "number" || typeof error === "boolean" || typeof error === "bigint") {
      return `erro desconhecido (${sanitizeMessage(String(error))})`;
    }

    return `erro desconhecido (${error === null ? "null" : typeof error})`;
  }

  const name = sanitizeMessage(details.name) || "erro";
  const code = details.code ? ` [${sanitizeMessage(details.code)}]` : "";
  const message = sanitizeMessage(details.message);
  const prefix = `${name}${code}`;

  return message ? `${prefix}: ${message}` : prefix;
}
