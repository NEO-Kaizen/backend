import type { ZodError } from "zod";

const DEFAULT_TYPE_MESSAGES: Record<string, string> = {
  string: "Deve ser um texto.",
  number: "Deve ser um número.",
  object: "Deve ser um objeto.",
  array: "Informe uma lista.",
};

/** Limita o path ecoado na mensagem de erro (defesa contra chaves gigantes). */
const MAX_PATH_LENGTH = 50;

/**
 * Chaves de campo exibidas pela UI quando o path do Zod difere do nome do
 * campo no payload. Ex.: a UI expõe o erro de controles manuais como
 * `operational.hasManualControlsDetail`, mas o campo validado é
 * `operational.hasManualControls`.
 */
const UI_FIELD_KEYS: Record<string, string> = {
  "operational.hasManualControls": "operational.hasManualControlsDetail",
};

interface GroupedIssues {
  missing: ZodError["issues"][number][];
  invalid: ZodError["issues"][number][];
}

const isMissing = (issue: ZodError["issues"][number]): boolean =>
  issue.code === "invalid_type" &&
  /^Invalid input: expected \w+, received undefined$/.test(issue.message) &&
  issue.path.length > 0;

function renderMessage(issue: ZodError["issues"][number]): string {
  const match = /^Invalid input: expected (\w+), received /.exec(issue.message);
  const translated = match?.[1] ? DEFAULT_TYPE_MESSAGES[match[1]] : undefined;
  return translated ?? issue.message;
}

/** Path como chave de campo, aplicando o mapa de chaves da UI quando houver. */
function fieldKeyOf(issue: ZodError["issues"][number], fieldKeys: Record<string, string>): string {
  const raw = issue.path.map(String).join(".");
  return fieldKeys[raw] ?? raw;
}

function renderPath(issue: ZodError["issues"][number], fieldKeys: Record<string, string>): string {
  const key = fieldKeyOf(issue, fieldKeys);
  return key.length > MAX_PATH_LENGTH ? `${key.slice(0, MAX_PATH_LENGTH)}…` : key;
}

function groupIssues(error: ZodError): GroupedIssues {
  return {
    missing: error.issues.filter(isMissing),
    invalid: error.issues.filter((issue) => !isMissing(issue)),
  };
}

function buildSummary(
  grouped: GroupedIssues,
  fieldKeys: Record<string, string>,
  rootLabel: string,
): string {
  const seen = new Set<string>();
  const parts: string[] = [];

  if (grouped.missing.length > 0) {
    const missingFields = [
      ...new Set(grouped.missing.map((issue) => renderPath(issue, fieldKeys))),
    ];
    parts.push(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`);
  }
  if (grouped.invalid.length > 0) {
    const details = grouped.invalid
      .map((issue) => ({
        path: renderPath(issue, fieldKeys) || rootLabel,
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

export function formatZodIssues(error: ZodError, rootLabel = "payload"): string {
  return buildSummary(groupIssues(error), {}, rootLabel);
}

/**
 * Formata um erro do Zod para respostas `422` com erros por campo:
 * `{ message, fields }` onde `fields` é indexado pela chave exibida pela UI
 * (default: o path do Zod; sobrepõe campos com chave alternativa, como
 * `operational.hasManualControls` → `operational.hasManualControlsDetail`).
 */
export function buildZodFieldErrors(
  error: ZodError,
  fieldKeys: Record<string, string> = UI_FIELD_KEYS,
  rootLabel = "payload",
): { message: string; fields: Record<string, string> } {
  const grouped = groupIssues(error);
  const fields: Record<string, string> = {};

  for (const issue of grouped.missing) {
    fields[fieldKeyOf(issue, fieldKeys)] = "Campo obrigatório.";
  }
  for (const issue of grouped.invalid) {
    const key = fieldKeyOf(issue, fieldKeys) || rootLabel;
    if (!(key in fields)) {
      fields[key] = renderMessage(issue);
    }
  }

  return { message: buildSummary(grouped, fieldKeys, rootLabel), fields };
}
