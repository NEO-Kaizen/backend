/**
 * Banco de dados falso para testes.
 *
 * Os testes de integração/E2E nunca tocam um Postgres real: os módulos de
 * repository são mockados com `vi.mock` e apenas o `db.transaction` continua
 * sendo usado pelos services (principalmente pelo `recordAudit`). Este helper
 * devolve um objeto knex-like mínimo, com uma query builder "thenable" que
 * resolve para um array vazio, cobrindo `await trx("tabela").insert(...)`.
 */

type AnyFn = (...args: unknown[]) => unknown;

function createChainable(result: unknown): Record<string, unknown> {
  const target = function () {
    return proxy;
  } as unknown as Record<string, unknown>;

  const proxy = new Proxy(target, {
    get(_target, prop) {
      if (prop === "then") {
        return (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
      }
      if (prop === "catch") {
        return () => proxy;
      }
      if (prop === "fn") {
        return { now: () => new Date() };
      }
      if (prop === "toString" || prop === Symbol.toPrimitive) {
        return () => "[fake-query]";
      }
      return (..._args: unknown[]) => proxy;
    },
    apply() {
      return proxy;
    },
  }) as unknown as Record<string, unknown>;

  return proxy;
}

export interface FakeDb {
  (...args: unknown[]): unknown;
  transaction: (callback: (trx: unknown) => unknown) => Promise<unknown>;
  fn: { now: () => Date };
  raw: AnyFn;
  destroy: () => Promise<void>;
}

/** Cria uma instância isolada do banco falso. */
export function createFakeDb(): FakeDb {
  const db = ((..._args: unknown[]) => createChainable([])) as FakeDb;
  db.transaction = async (callback) => callback(createChainable([]));
  db.fn = { now: () => new Date() };
  db.raw = (..._args: unknown[]) => createChainable([]);
  db.destroy = async () => undefined;
  return db;
}
