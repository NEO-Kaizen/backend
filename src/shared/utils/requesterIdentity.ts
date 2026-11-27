/** Lê o header público `X-Requester-Identity` (`{ name, email }`). */
export function parseRequesterIdentity(
  header: string | undefined,
): { name: string; email: string } | null {
  if (!header) return null;
  try {
    const obj = JSON.parse(header) as { name?: unknown; email?: unknown };
    if (typeof obj.name !== "string" || typeof obj.email !== "string") return null;
    return { name: obj.name, email: obj.email };
  } catch {
    return null;
  }
}
