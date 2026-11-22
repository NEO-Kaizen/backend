import config from "dotenv";
config.config({ override: true });

const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// Supabase recommends a direct or session-mode connection for migrations.
// Runtime keeps DB_PORT from .env (usually the transaction pooler on 6543), and
// migrations can use a different port without changing the runtime connection.
const migrationConnection = {
  ...connection,
  port: Number(process.env.MIGRATION_DB_PORT) || 5432,
};

const migrations = {
  directory: ["./migrations", "./migrations/requester_request", "./migrations/users"],
  extension: "js",
};

export default {
  development: {
    client: "pg",
    connection,
    migrations,
    seeds: {
      directory: "./seeds/requester_request",
      extension: "js",
    },
  },
  production: {
    client: "pg",
    connection: migrationConnection,
    migrations,
  },
  scenarios: {
    client: "pg",
    connection,
    migrations,
    seeds: {
      directory: "./seeds/scenarios",
      extension: "js",
    },
  },
};
