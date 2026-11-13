import { afterEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";
import { makeAuthUser } from "../helpers/factories.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  getAuthState: vi.fn(),
  changePassword: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const authService = await import("../../src/modules/auth/auth.service.ts");

const OLD_PASSWORD = "SenhaAtual@123";

afterEach(() => {
  vi.clearAllMocks();
});

describe("auth.service.authenticate", () => {
  it("autentica com credenciais válidas e normaliza o e-mail", async () => {
    const passwordHash = await hashPassword(OLD_PASSWORD);
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
    );

    const result = await authService.authenticate({
      email: "  MARIA@neo.com ",
      password: OLD_PASSWORD,
    });

    expect(authRepository.findUserByEmail).toHaveBeenCalledWith("maria@neo.com");
    expect(result).toMatchObject({
      id: "1",
      email: "maria@neo.com",
      role: "Analista",
      mustChangePassword: false,
    });
  });

  it("rejeita senha incorreta com 401", async () => {
    const passwordHash = await hashPassword(OLD_PASSWORD);
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ password_hash: passwordHash }),
    );

    await expect(
      authService.authenticate({ email: "maria@neo.com", password: "errada" }),
    ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });
  });

  it("rejeita usuário inexistente sem revelar a causa (anti-enumeração)", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(undefined);

    await expect(
      authService.authenticate({ email: "nao@existe.com", password: OLD_PASSWORD }),
    ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });
  });

  it("rejeita usuário inativo mesmo com senha correta", async () => {
    const passwordHash = await hashPassword(OLD_PASSWORD);
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ is_active: false, password_hash: passwordHash }),
    );

    await expect(
      authService.authenticate({ email: "maria@neo.com", password: OLD_PASSWORD }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("auth.service.getSessionUser", () => {
  it("devolve a sessão do usuário ativo", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(makeAuthUser({ user_id: 7 }));

    const result = await authService.getSessionUser(7);
    expect(result.id).toBe("7");
  });

  it("rejeita usuário inexistente ou inativo", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(undefined);
    await expect(authService.getSessionUser(1)).rejects.toMatchObject({ statusCode: 401 });

    vi.mocked(authRepository.findUserById).mockResolvedValue(makeAuthUser({ is_active: false }));
    await expect(authService.getSessionUser(1)).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("auth.service.changePassword", () => {
  const body = {
    currentPassword: OLD_PASSWORD,
    newPassword: "NovaSenha@456",
    confirmNewPassword: "NovaSenha@456",
  };

  it("troca a senha e devolve o novo passwordChangedAt", async () => {
    const passwordHash = await hashPassword(OLD_PASSWORD);
    const changedAt = new Date("2026-02-02T12:00:00.000Z");
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ password_hash: passwordHash }),
    );
    vi.mocked(authRepository.changePassword).mockResolvedValue({ password_changed_at: changedAt });

    const result = await authService.changePassword(1, body, "127.0.0.1");

    expect(result.mustChangePassword).toBe(false);
    expect(result.passwordChangedAt).toBe(changedAt.getTime());
    expect(authRepository.changePassword).toHaveBeenCalledOnce();
  });

  it("rejeita senha atual incorreta", async () => {
    const passwordHash = await hashPassword(OLD_PASSWORD);
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ password_hash: passwordHash }),
    );

    await expect(
      authService.changePassword(1, { ...body, currentPassword: "errada" }, undefined),
    ).rejects.toMatchObject({ statusCode: 401, message: "Senha atual incorreta" });
  });

  it("rejeita nova senha igual à atual", async () => {
    const passwordHash = await hashPassword(OLD_PASSWORD);
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ password_hash: passwordHash }),
    );

    await expect(
      authService.changePassword(
        1,
        {
          currentPassword: OLD_PASSWORD,
          newPassword: OLD_PASSWORD,
          confirmNewPassword: OLD_PASSWORD,
        },
        undefined,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("retorna 404 quando o usuário não existe", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(undefined);
    await expect(authService.changePassword(1, body, undefined)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
