import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEffectivePermissions,
  PERMISSION_CATALOG,
} from "../../src/shared/catalog/permissionCatalog.ts";
import { comparePassword } from "../../src/shared/utils/passwordHandler.ts";
import { PROFILE_IDS } from "../helpers/factories.ts";
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

const usersService = await import("../../src/modules/users/users.service.ts");

const REQUESTER = {
  area: "Financeiro",
  department: "Contas a Pagar",
  manager: "Carlos Gestor",
  additionalContact: "11999999999",
};

/**
 * O Administrador base tem todas as chaves; a matriz de contas exige que o
 * alvo esteja estritamente contido no conjunto do ator.
 */
const ADMIN_PERMISSIONS = buildEffectivePermissions(
  PERMISSION_CATALOG.map((entry) => ({
    permission_key: entry.key,
    custody:
      entry.custodyType === "global"
        ? "global"
        : (entry.allowedCustodies as readonly string[]).includes("own")
          ? "own"
          : "all",
  })),
);

function adminActor(id: number) {
  return { id, permissions: ADMIN_PERMISSIONS };
}

/** Perfis base são persistidos com o rótulo de exibição (`profiles.name`). */
async function insertAdminUser(input: { email?: string } = {}) {
  return insertUser({
    ...input,
    email: input.email ?? "admin@neo.com",
    profileName: "Administrador",
  });
}

async function insertAnalystUser(
  input: { email?: string; isActive?: boolean; password?: string } = {},
) {
  return insertUser({ ...input, email: input.email ?? "teste@neo.com", profileName: "Analista" });
}

beforeEach(async () => {
  await resetTestDb();

  // A suíte `db` não roda o seed de composição dos Perfis base (014); as flags
  // de Atribuibilidade são o que habilita a Extensão de profissional.
  await testDb("profiles")
    .where({ name: "Analista" })
    .update({ is_assignable_triage: true, is_assignable_mapping: true });
});

afterAll(async () => {
  await closeTestDb();
});

async function auditRows() {
  return testDb("audit_history").select("*").orderBy("audit_id", "asc");
}

describe("users.service (Postgres real)", () => {
  it("cria usuário e extensão requester na mesma transação, com auditoria", async () => {
    const admin = await insertAdminUser();

    const result = await usersService.createUser(
      {
        fullName: "Maria",
        email: "maria@neo.com",
        profileId: String(PROFILE_IDS.Solicitante),
        requester: REQUESTER,
      },
      adminActor(admin.user_id),
      "203.0.113.20",
    );

    expect(result).toMatchObject({
      email: "maria@neo.com",
      profile: { id: String(PROFILE_IDS.Solicitante), name: "Solicitante" },
      mustChangePassword: true,
    });
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);

    const persisted = await testDb("users").where({ email: "maria@neo.com" }).first();
    expect(persisted).toMatchObject({ full_name: "Maria", must_change_password: true });
    await expect(comparePassword(result.temporaryPassword, persisted.password_hash)).resolves.toBe(
      true,
    );

    const requester = await testDb("requesters").where({ user_id: persisted.user_id }).first();
    expect(requester).toMatchObject({
      full_name: "Maria",
      corporate_email: "maria@neo.com",
      area: REQUESTER.area,
      manager_name: REQUESTER.manager,
    });

    const audits = await auditRows();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      entity_type: "user",
      entity_id: String(persisted.user_id),
      action_type: "user.create",
      user_id: admin.user_id,
      ip_address: "203.0.113.20",
      change_origin: "admin",
    });
  });

  it("cria extensão profissional para Analista", async () => {
    const admin = await insertAdminUser();

    const result = await usersService.createUser(
      {
        fullName: "Ana",
        email: "ana@neo.com",
        profileId: String(PROFILE_IDS.Analista),
        requester: REQUESTER,
        professional: {
          jobTitle: "Analista de processos",
          specialties: ["Automação"],
          attendedCategoryIds: [1, 2],
          notes: "Disponível pela manhã",
        },
      },
      adminActor(admin.user_id),
      undefined,
    );

    const professional = await testDb("details_professional")
      .where({ user_id: Number(result.id) })
      .first();
    expect(professional).toMatchObject({
      job_title: "Analista de processos",
      specialties: "Automação",
      attended_category_ids: "1,2",
    });
  });

  it("converte e-mail duplicado em 409 pela constraint real", async () => {
    const admin = await insertAdminUser();
    const payload = {
      fullName: "Maria",
      email: "maria@neo.com",
      profileId: String(PROFILE_IDS.Solicitante),
      requester: REQUESTER,
    };

    await usersService.createUser(payload, adminActor(admin.user_id), undefined);

    await expect(
      usersService.createUser(payload, adminActor(admin.user_id), undefined),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "E-mail já cadastrado",
    });

    await expect(testDb("users").where({ email: "maria@neo.com" })).resolves.toHaveLength(1);
  });

  it("faz rollback da criação quando a auditoria falha (inclusive extensão profissional)", async () => {
    const admin = await insertAdminUser();

    await failAuditWrites();
    try {
      await expect(
        usersService.createUser(
          {
            fullName: "Ana",
            email: "ana@neo.com",
            profileId: String(PROFILE_IDS.Analista),
            requester: REQUESTER,
            professional: {
              jobTitle: "Analista",
              specialties: ["Automação"],
              attendedCategoryIds: [1],
            },
          },
          adminActor(admin.user_id),
          undefined,
        ),
      ).rejects.toThrow(/auditoria/i);
    } finally {
      await restoreAuditWrites();
    }

    await expect(testDb("users").where({ email: "ana@neo.com" })).resolves.toHaveLength(0);
    await expect(
      testDb("requesters").where({ corporate_email: "ana@neo.com" }),
    ).resolves.toHaveLength(0);
    await expect(testDb("details_professional")).resolves.toHaveLength(0);
    await expect(auditRows()).resolves.toHaveLength(0);
  });

  it("faz rollback da mudança de status quando a auditoria falha", async () => {
    const admin = await insertAdminUser();
    const target = await insertAnalystUser({ email: "alvo@neo.com" });

    await failAuditWrites();
    try {
      await expect(
        usersService.changeUserStatus(
          String(target.user_id),
          { isActive: false },
          adminActor(admin.user_id),
          undefined,
        ),
      ).rejects.toThrow(/auditoria/i);
    } finally {
      await restoreAuditWrites();
    }

    const persisted = await testDb("users").where({ user_id: target.user_id }).first();
    expect(persisted.is_active).toBe(true);
    await expect(auditRows()).resolves.toHaveLength(0);
  });

  it("altera status com auditoria e persiste a mudança", async () => {
    const admin = await insertAdminUser();
    const target = await insertAnalystUser({ email: "alvo@neo.com" });

    const result = await usersService.changeUserStatus(
      String(target.user_id),
      { isActive: false },
      adminActor(admin.user_id),
      "203.0.113.30",
    );

    expect(result).toEqual({ id: String(target.user_id), isActive: false });

    const persisted = await testDb("users").where({ user_id: target.user_id }).first();
    expect(persisted.is_active).toBe(false);

    const audits = await auditRows();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      entity_type: "user",
      entity_id: String(target.user_id),
      action_type: "user.deactivate",
      user_id: admin.user_id,
      ip_address: "203.0.113.30",
      previous_value: "true",
      new_value: "false",
    });
  });

  it("ativa usuário com auditoria user.activate", async () => {
    const admin = await insertAdminUser();
    const target = await insertAnalystUser({ email: "alvo@neo.com", isActive: false });

    const result = await usersService.changeUserStatus(
      String(target.user_id),
      { isActive: true },
      adminActor(admin.user_id),
      undefined,
    );

    expect(result).toEqual({ id: String(target.user_id), isActive: true });
    const persisted = await testDb("users").where({ user_id: target.user_id }).first();
    expect(persisted.is_active).toBe(true);

    const audits = await auditRows();
    expect(audits[0]).toMatchObject({
      action_type: "user.activate",
      previous_value: "false",
      new_value: "true",
    });
  });

  it("faz rollback do reset de senha quando a auditoria falha", async () => {
    const admin = await insertAdminUser();
    const target = await insertAnalystUser({ email: "alvo@neo.com", password: "SenhaAntiga@123" });
    const before = await testDb("users").where({ user_id: target.user_id }).first();

    await failAuditWrites();
    try {
      await expect(
        usersService.resetPassword(String(target.user_id), adminActor(admin.user_id), undefined),
      ).rejects.toThrow(/auditoria/i);
    } finally {
      await restoreAuditWrites();
    }

    const persisted = await testDb("users").where({ user_id: target.user_id }).first();
    await expect(comparePassword("SenhaAntiga@123", persisted.password_hash)).resolves.toBe(true);
    expect(persisted.must_change_password).toBe(before.must_change_password);
    expect(persisted.password_changed_at.getTime()).toBe(before.password_changed_at.getTime());
    await expect(auditRows()).resolves.toHaveLength(0);
  });

  it("gera senha temporária real, avança password_changed_at e invalida a anterior", async () => {
    const admin = await insertAdminUser();
    const target = await insertAnalystUser({ email: "alvo@neo.com", password: "SenhaAntiga@123" });
    const before = await testDb("users").where({ user_id: target.user_id }).first();

    const result = await usersService.resetPassword(
      String(target.user_id),
      adminActor(admin.user_id),
      undefined,
    );

    const persisted = await testDb("users").where({ user_id: target.user_id }).first();
    await expect(comparePassword(result.temporaryPassword, persisted.password_hash)).resolves.toBe(
      true,
    );
    expect(persisted.must_change_password).toBe(true);
    // Reset administrativo também precisa revogar sessões antigas.
    expect(persisted.password_changed_at.getTime()).toBeGreaterThan(
      before.password_changed_at.getTime(),
    );

    const audits = await auditRows();
    expect(audits[0]).toMatchObject({ action_type: "user.reset_password", user_id: admin.user_id });
  });
});
