import process from "node:process";

try {
  process.loadEnvFile();
} catch {
  // O .env pode ainda não existir enquanto o banco não foi disponibilizado.
}

export default {
  development: {
    client: "pg",

    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },

    migrations: {
      directory: "./migrations",
      extension: "js",
    },
  },
};
