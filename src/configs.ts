const Config = {
  PORT: process.env.PORT ?? 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  CORS_ORIGINS:
    process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? "http://localhost:5173",
};

export default Config;
