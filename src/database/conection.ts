import config from "dotenv";
import knex from "knex";

// Em teste o ambiente vem do Vitest: carregar `.env` com `override` poderia
// trocar banco/segredos de um teste hermético.
if (process.env.NODE_ENV !== "test") {
  config.config({ override: true });
}

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});
export default db;
