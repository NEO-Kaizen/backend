import type { ZodError } from "zod";

const DEFAULT_TYPE_MESSAGES: Record<string, string> = {
  string: "Deve ser um texto.",
  number: "Deve ser um número.",
  object: "Deve ser um objeto.",
  array: "Informe uma lista.",
};

/** Limita o path ecoado na mensagem de erro (defesa contra chaves gigantes). */
const MAX_PATH_LENGTH = 50;

function renderPath(issue: ZodError["issues"][number]): string {
  const full = issue.path.map(String).join(".");
  return full.length > MAX_PATH_LENGTH ? `${full.slice(0, MAX_PATH_LENGTH)}…` : full;
}

export function formatZodIssues(error: ZodError, rootLabel = "payload"): string {
  const isMissing = (issue: ZodError["issues"][number]): boolean =>
    issue.code === "invalid_type" &&
    /^Invalid input: expected \w+, received undefined$/.test(issue.message) &&
    issue.path.length > 0;

  const renderMessage = (issue: ZodError["issues"][number]): string => {
    const match = /^Invalid input: expected (\w+), received /.exec(issue.message);
    const translated = match?.[1] ? DEFAULT_TYPE_MESSAGES[match[1]] : undefined;
    return translated ?? issue.message;
  };

  const missingFields = error.issues.filter(isMissing).map(renderPath);
  const invalidFields = error.issues.filter((issue) => !isMissing(issue));

  // Uma mesma linha pode falhar em mais de um check (ex.: regex + refine);
  // a primeira mensagem por campo evita duplicatas na resposta.
  const seen = new Set<string>();
  const parts: string[] = [];
  if (missingFields.length > 0) {
    parts.push(`Campos obrigatórios ausentes: ${[...new Set(missingFields)].join(", ")}`);
  }
  if (invalidFields.length > 0) {
    const details = invalidFields
      .map((issue) => ({
        path: renderPath(issue) || rootLabel,
        message: renderMessage(issue),
      }))
      .filter((detail) => {
        if (seen.has(detail.path)) return false;
        seen.add(detail.path);
        return true;
      })
      .map((detail) => `${detail.path} — ${detail.message}`)
      .join("; ");
    parts.push(`Campos inválidos: ${details}`);
  }
  return parts.join(". ");
}
