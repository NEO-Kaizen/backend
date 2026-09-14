/**
 * Serializa para JSON com chaves ordenadas lexicograficamente (nível 1).
 *
 * Garante snapshots/diffs determinísticos no `audit_history` e na coluna
 * `notes` (jsonb) independentemente da ordem das chaves vindas do cliente.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
}
