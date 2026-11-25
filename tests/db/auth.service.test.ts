import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { comparePassword } from "../../src/shared/utils/passwordHandler.ts";
import {
  closeTestDb,
  failAuditWrites,
  insertUser,
  resetTestDb,
  restoreAuditWrites,
  testDb,
} from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const authService = await import("../../src/modules/auth/auth.service.ts");

const PASSWORD = "SenhaAtual@123";
const NEW_PASSWORD = "NovaSenha@456";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

async function auditRows() {
  return testDb("audit_history").select("*").orderBy("audit_id", "asc");
}

describe("auth.service (Postgres real)", () => {
  it("autentica com hash real e normaliza o e-mail", async () => {
    const user = await insertUser({ email: "maria@neo.com", password: PASSWORD });

    const result = await authService.authenticate({
      email: "  MARIA@neo.com ",
      password: PASSWORD,
    });

    expect(result).toMatchObject({
      id: String(user.user_id),
      email: "maria@neo.com",
      role: "Analista",
      mustChangePassword: false,
    });
  });

  it("rejeita senha incorreta e usuário inativo com 401", async () => {
    await insertUser({ email: "maria@neo.com", password: PASSWORD });
    await insertUser({ email: "inativo@neo.com", password: PASSWORD, isActive: false });

    await expect(
      authService.authenticate({ email: "maria@neo.com", password: "errada" }),
    ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });

    await expect(
      authService.authenticate({ email: "inativo@neo.com", password: PASSWORD }),
    ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });
  });

  it("rejeita perfil inativo mesmo com senha correta", async () => {
    await insertUser({ email: "maria@neo.com", password: PASSWORD });
    await testDb("profiles").where({ name: "analista" }).update({ is_active: false });

    try {
      await expect(
        authService.authenticate({ email: "maria@neo.com", password: PASSWORD }),
      ).rejects.toMatchObject({ statusCode: 401 });
    } finally {
      await testDb("profiles").where({ name: "analista" }).update({ is_active: true });
    }
  });

  it("troca a senha, grava auditoria e invalida a senha antiga", async () => {
    const user = await insertUser({ email: "maria@neo.com", password: PASSWORD });

    const result = await authService.changePassword(
      user.user_id,
      {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmNewPassword: NEW_PASSWORD,
      },
      "203.0.113.10",
    );

    expect(result.mustChangePassword).toBe(false);
    expect(result.passwordChangedAt).toBeGreaterThanOrEqual(
      new Date("2026-01-01T00:00:00.000Z").getTime(),
    );

    const updated = await testDb("users").where({ user_id: user.user_id }).first();
    await expect(comparePassword(NEW_PASSWORD, updated.password_hash)).resolves.toBe(true);
    await expect(comparePassword(PASSWORD, updated.password_hash)).resolves.toBe(false);

    const audits = await auditRows();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      entity_type: "user",
      entity_id: String(user.user_id),
      action_type: "user.change_password",
      user_id: user.user_id,
      ip_address: "203.0.113.10",
      change_origin: "user",
    });
  });

  it("faz rollback da troca de senha quando a auditoria falha", async () => {
    const user = await insertUser({ email: "maria@neo.com", password: PASSWORD });

    await failAuditWrites();
    try {
      await expect(
        authService.changePassword(
          user.user_id,
          {
            currentPassword: PASSWORD,
            newPassword: NEW_PASSWORD,
            confirmNewPassword: NEW_PASSWORD,
          },
          "203.0.113.10",
        ),
      ).rejects.toThrow(/auditoria/i);
    } finally {
      await restoreAuditWrites();
    }

    const unchanged = await testDb("users").where({ user_id: user.user_id }).first();
    await expect(comparePassword(PASSWORD, unchanged.password_hash)).resolves.toBe(true);
    await expect(comparePassword(NEW_PASSWORD, unchanged.password_hash)).resolves.toBe(false);
    await expect(auditRows()).resolves.toHaveLength(0);
  });

  it("devolve a sessão apenas para usuário ativo e perfil ativo", async () => {
    const user = await insertUser({ email: "maria@neo.com" });

    await expect(authService.getSessionUser(user.user_id)).resolves.toMatchObject({
      id: String(user.user_id),
      email: "maria@neo.com",
    });

    await testDb("users").where({ user_id: user.user_id }).update({ is_active: false });
    await expect(authService.getSessionUser(user.user_id)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
