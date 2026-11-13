import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUserRow, UserRow } from "../../src/shared/types/user.ts";
import { makeAuthUser } from "../helpers/factories.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/users/users.repository.ts", () => ({
  findProfileIdByName: vi.fn(),
  isProfessionalProfile: vi.fn(),
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
  deleteProfessionalData: vi.fn(),
  removeUserAvatar: vi.fn(),
  setUserAvatar: vi.fn(),
}));

const repository = await import("../../src/modules/users/users.repository.ts");
const usersService = await import("../../src/modules/users/users.service.ts");

function makeUserRow(overrides: Partial<UserRow> = {}): UserRow {
  const now = new Date("2026-01-01T00:00:00.000Z");
  return {
    user_id: 10,
    full_name: "Novo Usuário",
    email: "novo@neo.com",
    avatar_url: null,
    password_hash: "hash",
    profile_id: 1,
    is_active: true,
    must_change_password: true,
    password_changed_at: now,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

const requesterBlock = {
  area: "Financeiro",
  department: "Contas",
  manager: "Gestor",
  additionalContact: null,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("users.service.createUser", () => {
  const payload = {
    fullName: "Novo Usuário",
    email: "novo@neo.com",
    role: "Solicitante",
    requester: requesterBlock,
  };

  it("recusa perfil inexistente com 400", async () => {
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(null);

    await expect(usersService.createUser(payload, 1, undefined)).rejects.toMatchObject({
      statusCode: 400,
      message: "Perfil inválido.",
    });
  });

  it("bloqueia criação de conta de Administrador (escalonamento vertical)", async () => {
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(4);

    await expect(
      usersService.createUser({ ...payload, role: "Administrador" }, 1, undefined),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("cria o usuário, vincula requester e devolve senha temporária", async () => {
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(1);
    vi.mocked(repository.isProfessionalProfile).mockReturnValue(false);
    vi.mocked(repository.createUser).mockResolvedValue(makeUserRow());
    vi.mocked(repository.createRequesterData).mockResolvedValue(undefined);

    const result = await usersService.createUser(payload, 1, "127.0.0.1");

    expect(result).toMatchObject({
      id: "10",
      email: "novo@neo.com",
      role: "Solicitante",
      mustChangePassword: true,
    });
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(repository.createRequesterData).toHaveBeenCalledOnce();
  });

  it("converte violação de unicidade em 409 (e-mail duplicado)", async () => {
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(1);
    vi.mocked(repository.isProfessionalProfile).mockReturnValue(false);
    vi.mocked(repository.createUser).mockRejectedValue({ code: "23505" });

    await expect(usersService.createUser(payload, 1, undefined)).rejects.toMatchObject({
      statusCode: 409,
      message: "E-mail já cadastrado",
    });
  });
});

describe("users.service.changeUserStatus", () => {
  it("impede o admin de modificar a própria conta", async () => {
    await expect(
      usersService.changeUserStatus("1", { isActive: false }, 1, undefined),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("retorna 404 quando o alvo não existe", async () => {
    vi.mocked(repository.findUserById).mockResolvedValue(undefined);
    await expect(
      usersService.changeUserStatus("9", { isActive: false }, 1, undefined),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("bloqueia gestão de contas de Administrador", async () => {
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 9, profile_name: "administrador" }) as AuthUserRow,
    );
    await expect(
      usersService.changeUserStatus("9", { isActive: false }, 1, undefined),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("desativa o usuário com sucesso", async () => {
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 9, is_active: true }),
    );
    vi.mocked(repository.updateStatus).mockResolvedValue(undefined);

    const result = await usersService.changeUserStatus("9", { isActive: false }, 1, undefined);
    expect(result).toEqual({ id: "9", isActive: false });
    expect(repository.updateStatus).toHaveBeenCalledWith(expect.anything(), 9, false);
  });
});

describe("users.service.resetPassword", () => {
  it("impede redefinir a própria senha", async () => {
    await expect(usersService.resetPassword("1", 1, undefined)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("gera senha temporária e persiste o hash", async () => {
    vi.mocked(repository.findUserById).mockResolvedValue(makeAuthUser({ user_id: 9 }));
    vi.mocked(repository.setTemporaryPassword).mockResolvedValue(undefined);

    const result = await usersService.resetPassword("9", 1, undefined);
    expect(result.id).toBe("9");
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(repository.setTemporaryPassword).toHaveBeenCalledOnce();
  });
});

describe("users.service.listUsers / getMyProfile", () => {
  it("valida o filtro de perfil contra a tabela profiles", async () => {
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(null);
    await expect(
      usersService.listUsers({ profile: "inexistente", page: 1, pageSize: 10 }),
    ).rejects.toMatchObject({ statusCode: 400, message: "Perfil inválido." });
  });

  it("delega a listagem ao repository quando o filtro é válido", async () => {
    const page = { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(2);
    vi.mocked(repository.listUsers).mockResolvedValue(page);

    await expect(
      usersService.listUsers({ profile: "Analista", page: 1, pageSize: 10 }),
    ).resolves.toEqual(page);
  });

  it("analista legado sem extensão recebe bloco professional com defaults", async () => {
    vi.mocked(repository.findUserProfile).mockResolvedValue({
      user_id: 5,
      full_name: "Ana",
      email: "ana@neo.com",
      avatar_url: null,
      profile_name: "analista",
      requester: null,
      professional: null,
    });

    const profile = await usersService.getMyProfile(5);
    expect(profile.role).toBe("Analista");
    expect(profile.professional).toEqual({
      jobTitle: null,
      specialties: [],
      attendedCategoryIds: [],
      notes: null,
    });
  });
});
