const NODE_ENV = process.env.NODE_ENV ?? "development";

function resolveProtocolFpeKey(): string {
  const key = process.env.PROTOCOL_FPE_KEY;
  if (key) return key;

  if (NODE_ENV === "production") {
    throw new Error("A variável de ambiente PROTOCOL_FPE_KEY é obrigatória em produção.");
  }

  return "neo-kaizen-dev-protocol-key";
}

const Config = {
  PORT: process.env.PORT ?? 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
  NODE_ENV,
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? [
    "http://localhost:5173",
  ],
  COOKIE_MAX_AGE: jwtExpiryToMs(process.env.JWT_EXPIRES_IN ?? "1d"),
  COOKIE_NAME: process.env.COOKIE_NAME ?? "session_id",
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",
  PROTOCOL_FPE_KEY: resolveProtocolFpeKey(),
};

function jwtExpiryToMs(value: string): number {
  const num = Number(value.slice(0, -1));
  const unit = value.slice(-1);
  if (unit === "d") return num * 24 * 60 * 60 * 1000;
  if (unit === "h") return num * 60 * 60 * 1000;
  if (unit === "m") return num * 60 * 1000;
  return num * 1000;
}

export default Config;
