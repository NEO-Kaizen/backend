import config from "dotenv";
config.config({ override: true });

const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const migrations = {
  directory: ["./migrations", "./migrations/requester_request"],
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
