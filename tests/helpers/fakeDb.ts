/**
 * Banco falso para testes de service (repositories mockados).
 *
 * Diferente do fake genérico anterior, este helper é fail-closed e
 * observável:
 * - só aceita a query que os services realmente fazem fora dos repositories:
 *   `trx("audit_history").insert(...).returning("audit_id")`;
 * - qualquer outra tabela, método ou query fora de transação lança erro;
 * - os eventos de auditoria ficam registrados para asserções;
 * - commit/rollback são contados, mas a atomicidade real é provada na suíte
 *   `db` (Postgres + trigger de falha).
 */

export interface FakeAuditRow {
  [key: string]: unknown;
}

interface FakeDbState {
  auditRows: FakeAuditRow[];
  transactions: number;
  commits: number;
  rollbacks: number;
}

export const fakeDbState: FakeDbState = {
  auditRows: [],
  transactions: 0,
  commits: 0,
  rollbacks: 0,
};

export function resetFakeDb(): void {
  fakeDbState.auditRows.length = 0;
  fakeDbState.transactions = 0;
  fakeDbState.commits = 0;
  fakeDbState.rollbacks = 0;
}

interface ChainableInsert {
  returning: (column: string) => Promise<Array<{ audit_id: number }>>;
}

function auditBuilder(table: string): { insert: (row: FakeAuditRow) => ChainableInsert } {
  if (table !== "audit_history") {
    throw new Error(`fakeDb: query inesperada na tabela "${table}" fora de um repository mockado.`);
  }

  return {
    insert: (row) => {
      if (typeof row !== "object" || row === null) {
        throw new Error("fakeDb: insert de auditoria exige um objeto.");
      }

      return {
        returning: async (column) => {
          if (column !== "audit_id") {
            throw new Error(`fakeDb: returning inesperado "${column}" em audit_history.`);
          }
          fakeDbState.auditRows.push({ ...row });
          return [{ audit_id: fakeDbState.auditRows.length }];
        },
      };
    },
  };
}

function unexpected(message: string): never {
  throw new Error(`fakeDb: ${message}`);
}

export interface FakeDb {
  (table: string): ReturnType<typeof auditBuilder>;
  transaction: (callback: (trx: unknown) => unknown) => Promise<unknown>;
  fn: { now: () => Date };
  raw: () => never;
  destroy: () => Promise<void>;
}

/** Cria uma instância isolada do banco falso. */
export function createFakeDb(): FakeDb {
  const trx = (table: string) => auditBuilder(table);
  trx.fn = { now: () => new Date() };

  const db = ((table: string) => {
    unexpected(
      `query na tabela "${table}" fora de transação (repositories deveriam estar mockados).`,
    );
  }) as unknown as FakeDb;

  db.transaction = async (callback) => {
    fakeDbState.transactions += 1;
    try {
      const result = await callback(trx);
      fakeDbState.commits += 1;
      return result;
    } catch (error) {
      fakeDbState.rollbacks += 1;
      throw error;
    }
  };
  db.fn = { now: () => new Date() };
  db.raw = () => unexpected("raw() não é suportado pelo fakeDb.");
  db.destroy = async () => undefined;

  return db;
}
