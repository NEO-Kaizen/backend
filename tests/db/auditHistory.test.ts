import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { closeTestDb, insertAdmin, resetTestDb, testDb } from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

async function insertAudit(userId: number | null = null): Promise<void> {
  await testDb("audit_history").insert({
    entity_type: "user",
    entity_id: "1",
    action_type: "user.create",
    user_id: userId,
  });
}

describe("audit_history (Postgres real)", () => {
  it("rejeita UPDATE, DELETE e TRUNCATE (append-only)", async () => {
    await insertAudit();

    await expect(
      testDb("audit_history").where({ entity_id: "1" }).update({ entity_id: "2" }),
    ).rejects.toThrow(/append-only/i);

    await expect(testDb("audit_history").where({ entity_id: "1" }).del()).rejects.toThrow(
      /append-only/i,
    );

    await expect(testDb.raw("TRUNCATE TABLE audit_history")).rejects.toThrow(/append-only/i);
  });

  it("mantém o trigger ativo depois do reset", async () => {
    await insertAudit();
    await resetTestDb();
    await insertAudit();

    await expect(testDb("audit_history").where({ entity_id: "1" }).del()).rejects.toThrow(
      /append-only/i,
    );
  });

  it("impede apagar usuário que possui histórico (FK RESTRICT)", async () => {
    const admin = await insertAdmin();
    await insertAudit(admin.user_id);

    await expect(testDb("users").where({ user_id: admin.user_id }).del()).rejects.toThrow(
      /audit_history_user_id_foreign|foreign key/i,
    );
  });
});
