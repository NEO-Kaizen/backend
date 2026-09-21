type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyGenerator?: (key: string) => string;
};

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, limit, keyGenerator } = options;
  const buckets = new Map<string, number[]>();

  function checkRateLimit(key: string): boolean {
    const normalized = keyGenerator ? keyGenerator(key) : key;
    const now = Date.now();
    const arr = buckets.get(normalized) ?? [];
    const recent = arr.filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      buckets.set(normalized, recent);
      return false;
    }
    recent.push(now);
    buckets.set(normalized, recent);
    return true;
  }

  function clearRateLimit(): void {
    buckets.clear();
  }

  return { checkRateLimit, clearRateLimit };
}
