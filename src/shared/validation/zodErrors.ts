import type { ZodError } from "zod";

// Converte um ZodError na mensagem 400 do contrato (pt-BR), indicando os campos:
// "Campos obrigatórios ausentes: demand.expectedResult, operational.volumetry"
// "Campos inválidos: demand.title — Máximo de 150 caracteres; ..."
export function formatZodIssues(error: ZodError, rootLabel = "payload"): string {
  const isMissing = (issue: ZodError["issues"][number]): boolean =>
    issue.code === "invalid_type" && issue.input === undefined && issue.path.length > 0;

  const missingFields = error.issues
    .filter(isMissing)
    .map((issue) => issue.path.map(String).join("."));

  const invalidFields = error.issues.filter((issue) => !isMissing(issue));

  const parts: string[] = [];
  if (missingFields.length > 0) {
    parts.push(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`);
  }
  if (invalidFields.length > 0) {
    const details = invalidFields
      .map((issue) => `${issue.path.map(String).join(".") || rootLabel} — ${issue.message}`)
      .join("; ");
    parts.push(`Campos inválidos: ${details}`);
  }
  return parts.join(". ");
}
