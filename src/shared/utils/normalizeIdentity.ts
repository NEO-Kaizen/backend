export function normalizeName(v: string): string {
  return v
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}
