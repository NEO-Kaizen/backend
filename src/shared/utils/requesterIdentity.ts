const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lê o header público `X-Requester-Identity` (`{ name, email }`). */
export function parseRequesterIdentity(
  header: string | undefined,
): { name: string; email: string } | null {
  if (!header) return null;
  try {
    const obj = JSON.parse(header) as { name?: unknown; email?: unknown };
    if (typeof obj.name !== "string" || typeof obj.email !== "string") return null;

    const name = obj.name.trim();
    const email = obj.email.trim().toLowerCase();

    if (name === "" || !EMAIL_PATTERN.test(email)) return null;

    return { name, email };
  } catch {
    return null;
  }
}
