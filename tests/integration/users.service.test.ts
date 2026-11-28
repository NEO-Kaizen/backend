import { afterEach, describe, expect, it, vi } from "vitest";
import { makeAuthUser, makeUserRow } from "../helpers/factories.ts";
import { fakeDbState, resetFakeDb } from "../helpers/fakeDb.ts";
import { BASE_PROFILES } from "../../src/shared/catalog/baseProfiles.ts";
import {
  buildEffectivePermissions,
  type PermissionGrantSource,
} from "../../src/shared/catalog/permissionCatalog.ts";
import type { ProfileLookupRow, UserProfileRow } from "../../src/modules/users/users.repository.ts";
import type { AccountActor } from "../../src/modules/users/users.service.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

// `recordAudit` resolve o snapshot do Perfil do ator com um JOIN em `users` que
// o fakeDb não modela; aqui o evento é observado pela chamada, e a atomicidade
// (commit/rollback) continua provada pelo fakeDb.
vi.mock("../../src/shared/audit/auditLogger.ts", () => ({
  recordAudit: vi.fn(),
}));

vi.mock("../../src/modules/users/users.repository.ts", () => ({
  findProfileById: vi.fn(),
  listProfilePermissions: vi.fn(),
  createUser: vi.fn(),
  createProfessionalData: vi.fn(),
  createRequesterData: vi.fn(),
  findUserById: vi.fn(),
  findUserProfile: vi.fn(),
  updateStatus: vi.fn(),
  setTemporaryPassword: vi.fn(),
  listUsers: vi.fn(),
  listAnalysts: vi.fn(),
  fetchUserMetrics: vi.fn(),
  mergeRequesterData: vi.fn(),
  updateUserFields: vi.fn(),
  syncRequesterIdentity: vi.fn(),
  upsertProfessionalData: vi.fn(),
  upsertRequesterData: vi.fn(),
  deleteProfessionalData: vi.fn(),
  removeUserAvatar: vi.fn(),
  setUserAvatar: vi.fn(),
  listOpenAssignedProtocolsForUser: vi.fn(),
  listAssignableProfessionals: vi.fn(),
  findRequesterUserIdByProtocol: vi.fn(),
}));

const repository = await import("../../src/modules/users/users.repository.ts");
const usersService = await import("../../src/modules/users/users.service.ts");
const auditLogger = await import("../../src/shared/audit/auditLogger.ts");

type BaseProfileName = "Solicitante" | "Analista" | "Gestor" | "Administrador" | "Admin Root";

/** Concessões reais da matriz de perfis base (`src/shared/catalog/baseProfiles.ts`). */
function grantRowsOf(profileName: BaseProfileName): PermissionGrantSource[] {
  const profile = BASE_PROFILES.find((candidate) => candidate.profileName === profileName);
  if (!profile) throw new Error(`Perfil base ausente: ${profileName}`);

  return profile.permissions.map(({ key, custody }) => ({ permission_key: key, custody }));
}

function permissionsOf(profileName: BaseProfileName) {
  return buildEffectivePermissions(grantRowsOf(profileName));
}

/** Ator da matriz de contas: id da conta + Permissões efetivas do gate. */
function makeAccountActor(profileName: BaseProfileName, id = 1): AccountActor {
  return { id, permissions: permissionsOf(profileName) };
}

function profileLookupRow(overrides: Partial<ProfileLookupRow> = {}): ProfileLookupRow {
  return {
    profile_id: 1,
    name: "Solicitante",
    is_root: false,
    is_active: true,
    is_assignable_triage: false,
    is_assignable_mapping: false,
    ...overrides,
  };
}

function arrangeProfileGrants(grantsByProfileId: Record<number, PermissionGrantSource[]>): void {
  vi.mocked(repository.listProfilePermissions).mockImplementation(
    async (profileId) => grantsByProfileId[profileId] ?? [],
  );
}

/**
 * `findUserById` serve tanto à conta-alvo quanto à autoridade do ator. Devolve
 * o ator para o seu id e o alvo para os demais.
 */
function arrangeActorAndTarget(
  actor: AccountActor,
  target: ReturnType<typeof makeAuthUser> | undefined,
  options: { actorIsRoot?: boolean } = {},
): void {
  vi.mocked(repository.findUserById).mockImplementation(async (id) =>
    id === actor.id
      ? makeAuthUser({
          user_id: actor.id,
          profile_name: options.actorIsRoot ? "admin root" : "administrador",
          profile_is_root: options.actorIsRoot ?? false,
        })
      : target,
  );
}

const requesterBlock = {
  area: "Financeiro",
  department: "Contas",
  manager: "Gestor",
  additionalContact: null,
};

function profileRow(overrides: Partial<UserProfileRow> = {}): UserProfileRow {
  return {
    user_id: 9,
    profile_id: 1,
    full_name: "Alvo",
    email: "alvo@neo.com",
    avatar_url: null,
    profile_name: "solicitante",
    is_active: true,
    is_assignable_triage: false,
    is_assignable_mapping: false,
    requester: {
      area: "Financeiro",
      department: null,
      manager_name: "Gestor",
      additional_contact: null,
    },
    professional: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

describe("users.service.createUser", () => {
  const payload = {
    fullName: "Novo Usuário",
    email: "novo@neo.com",
    profileId: "1",
    requester: requesterBlock,
  };

  it("recusa perfil inexistente com 400", async () => {
    vi.mocked(repository.findProfileById).mockResolvedValue(undefined);

    await expect(
      usersService.createUser(payload, makeAccountActor("Administrador"), undefined),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Perfil inválido.",
    });
  });

  it("bloqueia criação de conta de autoridade igual ou superior (escalonamento vertical)", async () => {
    const actor = makeAccountActor("Analista");
    arrangeActorAndTarget(actor, undefined);
    vi.mocked(repository.findProfileById).mockResolvedValue(
      profileLookupRow({ profile_id: 3, name: "Administrador" }),
    );
    arrangeProfileGrants({ 3: grantRowsOf("Administrador") });

    await expect(
      usersService.createUser({ ...payload, profileId: "3" }, actor, undefined),
    ).rejects.toMatchObject({ statusCode: 403, code: "account_out_of_authority" });
  });

  it("cria o usuário, vincula requester e devolve senha temporária", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, undefined);
    vi.mocked(repository.findProfileById).mockResolvedValue(profileLookupRow());
    arrangeProfileGrants({ 1: grantRowsOf("Solicitante") });
    vi.mocked(repository.createUser).mockResolvedValue(
      makeUserRow({
        user_id: 10,
        full_name: "Novo Usuário",
        email: "novo@neo.com",
        profile_id: 1,
        must_change_password: true,
      }),
    );
    vi.mocked(repository.createRequesterData).mockResolvedValue(undefined);

    const result = await usersService.createUser(payload, actor, "127.0.0.1");

    expect(result).toMatchObject({
      id: "10",
      email: "novo@neo.com",
      profile: { id: "1", name: "Solicitante" },
      isActive: true,
      mustChangePassword: true,
    });
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(repository.createRequesterData).toHaveBeenCalledOnce();
    // Perfil de origem não atribuível: nenhuma Extensão de profissional é criada.
    expect(repository.createProfessionalData).not.toHaveBeenCalled();

    expect(fakeDbState.transactions).toBe(1);
    expect(fakeDbState.commits).toBe(1);
    expect(auditLogger.recordAudit).toHaveBeenCalledOnce();
    expect(auditLogger.recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entityType: "user",
        entityId: "10",
        actionType: "user.create",
        userId: 1,
        newValue: "novo@neo.com",
        ipAddress: "127.0.0.1",
        changeOrigin: "admin",
      }),
    );
  });

  it("converte violação de unicidade em 409 (e-mail duplicado)", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, undefined);
    vi.mocked(repository.findProfileById).mockResolvedValue(profileLookupRow());
    arrangeProfileGrants({ 1: grantRowsOf("Solicitante") });
    vi.mocked(repository.createUser).mockRejectedValue({ code: "23505" });

    await expect(usersService.createUser(payload, actor, undefined)).rejects.toMatchObject({
      statusCode: 409,
      message: "E-mail já cadastrado",
    });
  });
});

describe("users.service.changeUserStatus", () => {
  it("impede o admin de modificar a própria conta", async () => {
    await expect(
      usersService.changeUserStatus(
        "1",
        { isActive: false },
        makeAccountActor("Administrador", 1),
        undefined,
      ),
    ).rejects.toMatchObject({ statusCode: 403, code: "self_management_forbidden" });
  });

  it("retorna 404 quando o alvo não existe", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, undefined);
    await expect(
      usersService.changeUserStatus("9", { isActive: false }, actor, undefined),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("bloqueia gestão de contas de autoridade igual ou superior", async () => {
    const actor = makeAccountActor("Analista");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9, profile_name: "administrador" }));
    arrangeProfileGrants({ 3: grantRowsOf("Administrador") });

    await expect(
      usersService.changeUserStatus("9", { isActive: false }, actor, undefined),
    ).rejects.toMatchObject({ statusCode: 403, code: "account_out_of_authority" });
  });

  it("desativa o usuário com sucesso", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9, is_active: true }));
    arrangeProfileGrants({ 2: grantRowsOf("Analista") });
    vi.mocked(repository.listOpenAssignedProtocolsForUser).mockResolvedValue([]);
    vi.mocked(repository.updateStatus).mockResolvedValue(undefined);

    const result = await usersService.changeUserStatus(
      "9",
      { isActive: false },
      actor,
      "203.0.113.40",
    );
    expect(result).toEqual({ id: "9", isActive: false });
    expect(repository.updateStatus).toHaveBeenCalledWith(expect.anything(), 9, false);

    expect(auditLogger.recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entityType: "user",
        entityId: "9",
        actionType: "user.deactivate",
        userId: 1,
        previousValue: "true",
        newValue: "false",
        ipAddress: "203.0.113.40",
      }),
    );
  });
});

describe("users.service.resetPassword", () => {
  it("impede redefinir a própria senha", async () => {
    await expect(
      usersService.resetPassword("1", makeAccountActor("Administrador", 1), undefined),
    ).rejects.toMatchObject({ statusCode: 403, code: "self_management_forbidden" });
  });

  it("gera senha temporária e persiste o hash", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9 }));
    arrangeProfileGrants({ 2: grantRowsOf("Analista") });
    vi.mocked(repository.setTemporaryPassword).mockResolvedValue(undefined);

    const result = await usersService.resetPassword("9", actor, "203.0.113.50");
    expect(result.id).toBe("9");
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(repository.setTemporaryPassword).toHaveBeenCalledOnce();

    expect(auditLogger.recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entityType: "user",
        entityId: "9",
        actionType: "user.reset_password",
        userId: 1,
        ipAddress: "203.0.113.50",
      }),
    );
  });
});

describe("users.service.updateUser", () => {
  const professional = {
    jobTitle: "Analista",
    specialties: ["Automação"],
    attendedCategoryIds: [1],
    notes: undefined,
  };

  it("impede o admin de editar a própria conta", async () => {
    await expect(
      usersService.updateUser("1", {}, makeAccountActor("Administrador", 1), undefined),
    ).rejects.toMatchObject({ statusCode: 403, code: "self_management_forbidden" });
  });

  it("retorna 404 quando o alvo não existe", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, undefined);
    await expect(
      usersService.updateUser("9", { fullName: "X" }, actor, undefined),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("bloqueia edição de conta de autoridade igual ou superior", async () => {
    const actor = makeAccountActor("Analista");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9, profile_name: "administrador" }));
    arrangeProfileGrants({ 3: grantRowsOf("Administrador") });

    await expect(
      usersService.updateUser("9", { fullName: "X" }, actor, undefined),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "account_out_of_authority",
    });
  });

  it("bloqueia promoção para Administrador (escalonamento vertical)", async () => {
    const actor = makeAccountActor("Analista");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9, profile_name: "solicitante" }));
    arrangeProfileGrants({
      1: grantRowsOf("Solicitante"),
      3: grantRowsOf("Administrador"),
    });
    vi.mocked(repository.findProfileById).mockResolvedValue(
      profileLookupRow({ profile_id: 3, name: "Administrador" }),
    );

    await expect(
      usersService.updateUser("9", { profileId: "3" }, actor, undefined),
    ).rejects.toMatchObject({ statusCode: 403, code: "account_out_of_authority" });
  });

  it("recusa dados profissionais em perfil não-atribuível", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9, profile_name: "solicitante" }));
    arrangeProfileGrants({ 1: grantRowsOf("Solicitante") });
    vi.mocked(repository.findProfileById).mockResolvedValue(profileLookupRow());
    vi.mocked(repository.findUserProfile).mockResolvedValue(profileRow());

    await expect(
      usersService.updateUser("9", { professional }, actor, undefined),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "professional_profile_not_assignable",
    });
  });

  it("cria a Extensão de profissional ao promover para Perfil atribuível", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(actor, makeAuthUser({ user_id: 9, profile_name: "solicitante" }));
    arrangeProfileGrants({
      1: grantRowsOf("Solicitante"),
      2: grantRowsOf("Analista"),
    });
    vi.mocked(repository.findProfileById).mockImplementation(async (id) =>
      id === 2
        ? profileLookupRow({
            profile_id: 2,
            name: "Analista",
            is_assignable_triage: true,
            is_assignable_mapping: true,
          })
        : profileLookupRow(),
    );
    vi.mocked(repository.findUserProfile)
      .mockResolvedValueOnce(profileRow())
      .mockResolvedValueOnce(
        profileRow({
          profile_id: 2,
          profile_name: "analista",
          is_assignable_triage: true,
          is_assignable_mapping: true,
        }),
      );
    vi.mocked(repository.createProfessionalData).mockResolvedValue(undefined);

    const result = await usersService.updateUser("9", { profileId: "2" }, actor, undefined);

    expect(repository.createProfessionalData).toHaveBeenCalledWith(expect.anything(), 9);
    // Legado atribuível sem extensão recebe o bloco com defaults.
    expect(result.profile).toEqual({ id: "2", name: "analista" });
    expect(result.professional).toEqual({
      jobTitle: null,
      specialties: [],
      attendedCategoryIds: [],
      notes: null,
    });
  });

  it("atualiza o usuário, sincroniza a identidade e audita na mesma transação", async () => {
    const actor = makeAccountActor("Administrador");
    arrangeActorAndTarget(
      actor,
      makeAuthUser({ user_id: 9, email: "alvo@neo.com", profile_name: "solicitante" }),
    );
    arrangeProfileGrants({ 1: grantRowsOf("Solicitante") });
    vi.mocked(repository.findProfileById).mockResolvedValue(profileLookupRow());
    const before = profileRow();
    const after = profileRow({ full_name: "Alvo Novo", email: "novo@neo.com" });
    vi.mocked(repository.findUserProfile)
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(after);

    const result = await usersService.updateUser(
      "9",
      { fullName: "Alvo Novo", email: "novo@neo.com" },
      actor,
      "203.0.113.60",
    );

    expect(result).toMatchObject({ id: "9", fullName: "Alvo Novo", email: "novo@neo.com" });
    expect(repository.updateUserFields).toHaveBeenCalledOnce();
    expect(repository.syncRequesterIdentity).toHaveBeenCalledWith(expect.anything(), 9, {
      fullName: "Alvo Novo",
      corporateEmail: "novo@neo.com",
    });
    expect(fakeDbState.transactions).toBe(1);
    expect(fakeDbState.commits).toBe(1);
    expect(auditLogger.recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entityType: "user",
        entityId: "9",
        actionType: "user.update",
        userId: 1,
        ipAddress: "203.0.113.60",
        changeOrigin: "admin",
      }),
    );
  });
});

describe("users.service.updateMyProfile", () => {
  it("opera somente sobre o próprio ator (não há alvo externo)", async () => {
    const actor = makeAccountActor("Analista", 9);
    vi.mocked(repository.findUserById).mockResolvedValue(makeAuthUser({ user_id: 9 }));
    vi.mocked(repository.findUserProfile)
      .mockResolvedValueOnce(profileRow({ user_id: 9, profile_name: "analista", profile_id: 2 }))
      .mockResolvedValueOnce(
        profileRow({
          user_id: 9,
          profile_name: "analista",
          profile_id: 2,
          full_name: "Novo Nome",
        }),
      );

    await usersService.updateMyProfile(actor, { fullName: "Novo Nome" });

    expect(repository.findUserById).toHaveBeenCalledWith(9);
    expect(repository.updateUserFields).toHaveBeenCalledWith(expect.anything(), 9, {
      fullName: "Novo Nome",
    });
  });

  it("recusa remover e enviar avatar na mesma requisição", async () => {
    const avatar = {} as Express.Multer.File;
    await expect(
      usersService.updateMyProfile(makeAccountActor("Analista", 1), { removeAvatar: true }, avatar),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("bloqueia campos administrativos para quem não tem user:manage", async () => {
    const actor = makeAccountActor("Analista", 1);
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 1, profile_name: "analista" }),
    );
    vi.mocked(repository.findUserProfile).mockResolvedValue(
      profileRow({ user_id: 1, profile_name: "analista", profile_id: 2 }),
    );

    await expect(
      usersService.updateMyProfile(actor, { requester: { area: "Outra área" } }),
    ).rejects.toMatchObject({ statusCode: 403, code: "user_manage_required" });

    expect(fakeDbState.transactions).toBe(1);
    expect(fakeDbState.rollbacks).toBe(1);
    expect(auditLogger.recordAudit).not.toHaveBeenCalled();
  });

  it("atualiza nome/contato e audita como self-edit", async () => {
    const actor = makeAccountActor("Analista", 1);
    const before = profileRow({
      user_id: 1,
      profile_name: "analista",
      profile_id: 2,
      email: "maria@neo.com",
    });
    const after = profileRow({
      user_id: 1,
      profile_name: "analista",
      profile_id: 2,
      email: "maria@neo.com",
      full_name: "Maria Nova",
    });
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 1, profile_name: "analista", email: "maria@neo.com" }),
    );
    vi.mocked(repository.findUserProfile)
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(after);

    const result = await usersService.updateMyProfile(actor, {
      fullName: "Maria Nova",
      requester: { additionalContact: "11999999999" },
    });

    expect(result).toMatchObject({ id: "1", fullName: "Maria Nova" });
    expect(repository.updateUserFields).toHaveBeenCalledOnce();
    expect(repository.syncRequesterIdentity).toHaveBeenCalledOnce();
    expect(repository.mergeRequesterData).toHaveBeenCalledOnce();
    expect(fakeDbState.commits).toBe(1);
    expect(auditLogger.recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entityType: "user",
        entityId: "1",
        actionType: "user.update_profile",
        userId: 1,
        changeOrigin: "self",
      }),
    );
  });
});

describe("users.service.getUser / getMyProfile", () => {
  it("retorna 404 para id inválido sem consultar o repository", async () => {
    await expect(usersService.getUser("abc")).rejects.toMatchObject({ statusCode: 404 });
    await expect(usersService.getUser("0")).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findUserProfile).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o perfil não existe", async () => {
    vi.mocked(repository.findUserProfile).mockResolvedValue(undefined);
    await expect(usersService.getMyProfile(1)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("users.service.listUsers / getMyProfile", () => {
  it("valida o filtro de perfil contra a tabela profiles", async () => {
    vi.mocked(repository.findProfileById).mockResolvedValue(undefined);
    await expect(
      usersService.listUsers({ profileId: "99", page: 1, pageSize: 10 }),
    ).rejects.toMatchObject({ statusCode: 400, message: "Perfil inválido." });
  });

  it("delega a listagem ao repository quando o filtro é válido", async () => {
    const page = { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
    vi.mocked(repository.findProfileById).mockResolvedValue(
      profileLookupRow({ profile_id: 2, name: "Analista" }),
    );
    vi.mocked(repository.listUsers).mockResolvedValue(page);

    await expect(
      usersService.listUsers({ profileId: "2", page: 1, pageSize: 10 }),
    ).resolves.toEqual(page);
  });

  it("analista legado sem extensão recebe bloco professional com defaults", async () => {
    vi.mocked(repository.findUserProfile).mockResolvedValue({
      user_id: 5,
      profile_id: 2,
      full_name: "Ana",
      email: "ana@neo.com",
      avatar_url: null,
      profile_name: "analista",
      is_active: true,
      is_assignable_triage: true,
      is_assignable_mapping: true,
      requester: null,
      professional: null,
    });

    const profile = await usersService.getMyProfile(5);
    expect(profile.profile).toEqual({ id: "2", name: "analista" });
    expect(profile.professional).toEqual({
      jobTitle: null,
      specialties: [],
      attendedCategoryIds: [],
      notes: null,
    });
  });
});
