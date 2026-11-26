import knex, { type Knex } from "knex";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";
import type { UserRow } from "../../src/shared/types/user.ts";

/**
 * Banco de testes real (PostgreSQL descartável).
 *
 * A suíte `db` NÃO usa `src/database/conection.ts`: cada arquivo de teste
 * mocka o módulo de conexão para devolver esta instância. Assim o `.env` de
 * desenvolvimento nunca é carregado e o banco de teste é sempre explícito.
 *
 * Variáveis (todas opcionais, com defaults do `docker-compose.yml`):
 * - `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_NAME`,
 * - `TEST_DB_USER`, `TEST_DB_PASSWORD`.
 */
const ROOT_DIR = fileURLToPath(new URL("../../", import.meta.url));

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

function readHost(): string {
  const host = process.env.TEST_DB_HOST ?? "127.0.0.1";
  const isRemote = !LOOPBACK_HOSTS.has(host.toLowerCase());

  // Fail-closed: o reset executa TRUNCATE ... CASCADE, então um host remoto
  // exige opt-in explícito.
  if (isRemote && process.env.TEST_DB_ALLOW_REMOTE !== "true") {
    throw new Error(
      `Recusando rodar a suíte db contra o host "${host}": use localhost ou defina TEST_DB_ALLOW_REMOTE=true para um banco descartável remoto.`,
    );
  }

  return host;
}

function readPort(): number {
  const port = Number(process.env.TEST_DB_PORT ?? 55432);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`TEST_DB_PORT inválida: "${process.env.TEST_DB_PORT}".`);
  }

  return port;
}

function readDatabaseName(): string {
  const database = process.env.TEST_DB_NAME ?? "neo_test";

  // Fail-closed: exige sufixo `_test` (ou o nome exato `test`), não apenas a
  // substring "test" — "latest" não pode passar.
  if (!/^(test|[a-z0-9_]+_test)$/i.test(database)) {
    throw new Error(
      `Recusando rodar a suíte db contra "${database}": o nome do banco precisa ser "test" ou terminar em "_test".`,
    );
  }

  return database;
}

export const TEST_DB_CONFIG = {
  host: readHost(),
  port: readPort(),
  user: process.env.TEST_DB_USER ?? "neo_test",
  password: process.env.TEST_DB_PASSWORD ?? "neo_test",
  database: readDatabaseName(),
};

export const testDb = knex({
  client: "pg",
  connection: TEST_DB_CONFIG,
  pool: { min: 0, max: 5 },
  migrations: {
    directory: [
      resolve(ROOT_DIR, "migrations"),
      resolve(ROOT_DIR, "migrations/requester_request"),
      resolve(ROOT_DIR, "migrations/users"),
    ],
    extension: "js",
  },
});

/**
 * Sobe todas as migrations pendentes e os dados de referência que não são
 * criados por migration (criteria e priorities vivem nos seeds). Os seeds
 * usados aqui são idempotentes e não criam dados mutáveis.
 */
export async function ensureMigrated(): Promise<void> {
  await testDb.migrate.latest();

  for (const seed of ["002_criteria.js", "003_priorities.js"]) {
    await testDb.seed.run({
      directory: resolve(ROOT_DIR, "seeds/requester_request"),
      specific: seed,
      extension: "js",
    });
  }
}

/**
 * Limpa apenas os dados mutáveis e devolve os dados de referência ao baseline.
 *
 * O `TRUNCATE ... CASCADE` em `users` alcança `system_settings` pela FK
 * `updated_by` (ON DELETE SET NULL não protege contra TRUNCATE). Por isso o
 * singleton é recriado explicitamente depois da limpeza — um `UPDATE` não
 * basta, pois a linha já foi removida. `profiles` também volta a `is_active`,
 * restaurando mutações feitas por testes.
 *
 * `audit_history` é append-only por trigger no banco real; em teste o reset
 * desabilita triggers de usuário apenas nesta transação, via
 * `session_replication_role`.
 */
export async function resetTestDb(): Promise<void> {
  // Garante que um teste que falhou antes do `finally` não deixe o gatilho
  // de falha de auditoria ativo para os testes seguintes.
  await restoreAuditWrites();

  await testDb.transaction(async (trx) => {
    await trx.raw("SET LOCAL session_replication_role = replica");
    await trx.raw(`
      TRUNCATE TABLE audit_history, requests, requesters, details_professional, users
      RESTART IDENTITY CASCADE
    `);
  });

  // Baseline das referências mutáveis: settings/tema e o estado dos perfis
  // precisam existir/valer depois de qualquer reset. Delete + insert (em vez
  // de listar colunas) devolve todos os defaults da migration, inclusive após
  // evoluções de schema.
  await testDb("system_settings").del();
  await testDb("system_themes").del();
  await testDb("system_themes").insert({ theme_id: 1 });
  await testDb("system_settings").insert({ settings_id: 1, theme_id: 1 });
  await testDb("profiles").update({ is_active: true });

  // Allowlists do corpus de duplicidade (issues #209/#210): o reset devolve o
  // baseline das migrations — todas as categorias publicáveis e todos os
  // status elegíveis, exceto os desfechos 10, 13, 17 e 19. O 16 (Concluído)
  // passou a ser elegível na #210, dentro da janela configurável.
  await testDb("categories").update({ is_publicly_listable: true });
  await testDb("statuses").update({ is_duplicate_corpus_eligible: true });
  await testDb("statuses")
    .whereIn("status_id", [10, 13, 17, 19])
    .update({ is_duplicate_corpus_eligible: false });
}

export async function closeTestDb(): Promise<void> {
  await testDb.destroy();
}

export const DEFAULT_TEST_PASSWORD = "SenhaTeste@123";

interface InsertUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  profileName?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  passwordChangedAt?: Date;
}

/** Insere um usuário real com a senha (hash bcrypt) indicada. */
export async function insertUser(input: InsertUserInput = {}): Promise<UserRow> {
  const profileName = input.profileName ?? "analista";
  const profile = await testDb("profiles").where({ name: profileName }).first("profile_id");

  if (!profile) {
    throw new Error(`Perfil de teste não encontrado: ${profileName}`);
  }

  const [row] = (await testDb("users")
    .insert({
      full_name: input.fullName ?? "Usuário de Teste",
      email: input.email ?? "teste@neo.com",
      password_hash: await hashPassword(input.password ?? DEFAULT_TEST_PASSWORD),
      profile_id: profile.profile_id,
      is_active: input.isActive ?? true,
      must_change_password: input.mustChangePassword ?? false,
      password_changed_at: input.passwordChangedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    })
    .returning("*")) as UserRow[];

  if (!row) {
    throw new Error("Falha ao inserir usuário de teste.");
  }

  return row;
}

/** Cria um ator Administrador (necessário para a FK de `audit_history.user_id`). */
export async function insertAdmin(input: Omit<InsertUserInput, "profileName"> = {}) {
  return insertUser({
    ...input,
    profileName: "administrador",
    email: input.email ?? "admin@neo.com",
  });
}

/**
 * Força qualquer INSERT em `audit_history` a falhar, para provar que a
 * operação de negócio inteira sofre rollback (auditoria é atômica).
 */
export async function failAuditWrites(): Promise<void> {
  await testDb.raw(`
    CREATE OR REPLACE FUNCTION test_fail_audit_write()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'test: falha forçada na auditoria';
    END;
    $$;
  `);
  await testDb.raw(`
    CREATE TRIGGER test_fail_audit_write
    BEFORE INSERT ON audit_history
    FOR EACH ROW
    EXECUTE FUNCTION test_fail_audit_write();
  `);
}

/** Remove o gatilho de falha (chamar sempre em `finally`). */
export async function restoreAuditWrites(): Promise<void> {
  await testDb.raw("DROP TRIGGER IF EXISTS test_fail_audit_write ON audit_history");
  await testDb.raw("DROP FUNCTION IF EXISTS test_fail_audit_write()");
}

export type TestKnex = Knex;
