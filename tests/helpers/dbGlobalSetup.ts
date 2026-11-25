import { closeTestDb, ensureMigrated, TEST_DB_CONFIG } from "./testDb.ts";

/**
 * `globalSetup` do project `db`: aplica as migrations uma única vez antes dos
 * arquivos de teste. Cada arquivo limpa os dados mutáveis no `beforeEach`.
 */
export default async function setup(): Promise<void> {
  try {
    await ensureMigrated();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [
        "Não foi possível preparar o PostgreSQL de testes.",
        `Destino: ${TEST_DB_CONFIG.host}:${TEST_DB_CONFIG.port}/${TEST_DB_CONFIG.database}`,
        "Suba o banco descartável com `npm run test:db:up` e tente novamente.",
        `Erro original: ${message}`,
      ].join("\n"),
      { cause: error },
    );
  } finally {
    await closeTestDb();
  }
}
