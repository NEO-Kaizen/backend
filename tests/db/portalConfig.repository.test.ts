import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { closeTestDb, resetTestDb, testDb } from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const portalConfigRepository =
  await import("../../src/modules/portalConfig/portalConfig.repository.ts");

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe("portalConfig.repository (Postgres real)", () => {
  it("mantém o singleton de settings após o reset", async () => {
    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ solicitation_mode: "AUTHENTICATED", platform_name: "Outro" });

    await resetTestDb();

    const rows = await testDb("system_settings").select("*");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      settings_id: 1,
      theme_id: 1,
      solicitation_mode: "PUBLIC",
      platform_name: "MAAT",
    });

    await expect(portalConfigRepository.getSettingsRow()).resolves.toMatchObject({
      settings_id: 1,
      solicitation_mode: "PUBLIC",
    });
    await expect(portalConfigRepository.getSolicitationMode()).resolves.toBe("PUBLIC");
  });

  it("devolve o modo real do banco, sem cair no fallback PUBLIC", async () => {
    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ solicitation_mode: "AUTHENTICATED" });

    await expect(portalConfigRepository.getSolicitationMode()).resolves.toBe("AUTHENTICATED");
  });

  it("restaura profiles.is_active no reset", async () => {
    await testDb("profiles")
      .whereRaw("lower(name) = lower(?)", ["analista"])
      .update({ is_active: false });

    await resetTestDb();

    const profile = await testDb("profiles")
      .whereRaw("lower(name) = lower(?)", ["analista"])
      .first();
    expect(profile.is_active).toBe(true);
  });
});
