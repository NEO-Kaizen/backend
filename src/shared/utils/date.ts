/**
 * Helpers de formatação de data — fonte única das regras de conversão de
 * datas do PostgreSQL (DATE, TIMESTAMP com/sem timezone) para os formatos
 * dos contratos da API.
 */

/** Converte qualquer valor de data em ISO 8601 UTC ("yyyy-mm-ddTHH:MM:SS.sssZ"); null se inválido. */
export function normalizeIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

/** Normaliza para "yyyy-mm-dd" (parte da data local) — null se inválido. */
export function normalizeIsoDateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-mm-dd" no fuso America/Sao_Paulo — null se inválido. */
export function toSaoPauloDateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// `desired_deadline` é DATE (sem timezone); o driver pg devolve um Date em
// componentes locais. Extraímos ano/mês/dia diretamente (sem passar por
// toISOString/UTC) para não arriscar deslocar o dia conforme o fuso do
// processo, e formatamos como "yyyy-mm-dd" (contrato documentado).
export function toDateOnly(value: Date | string): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

// `scheduled_for` (request_time_preferences) é TIMESTAMP sem timezone —
// mesmo raciocínio de toDateOnly, mas preservando hora:minuto.
export function toDateTimeMinutes(value: Date | string): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  return value.slice(0, 16);
}
