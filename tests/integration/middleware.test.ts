import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  makeAuthState,
  makeExpiredToken,
  makeTamperedToken,
  makeToken,
} from "../helpers/factories.ts";

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
}));

vi.mock("../../src/modules/portalConfig/portalConfig.repository.ts", () => ({
  getSolicitationMode: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const portalConfigRepository =
  await import("../../src/modules/portalConfig/portalConfig.repository.ts");
const { authMiddleware } = await import("../../src/shared/middleware/auth.ts");
const { requireRole } = await import("../../src/shared/middleware/requireRole.ts");
const { requesterDualAuth } = await import("../../src/shared/middleware/dualAuth.ts");
const { requireAccessMode } = await import("../../src/shared/middleware/accessMode.ts");

interface FakeRequest extends Partial<Request> {
  cookies: Record<string, string>;
  headers: Record<string, string>;
}

function makeReq(overrides: Partial<FakeRequest> = {}): Request {
  return {
    cookies: {},
    headers: {},
    originalUrl: "/alguma-rota",
    params: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {} as Response;
}

type NextSpy = ReturnType<typeof vi.fn> & NextFunction;

/** `next()` tipado como `NextFunction` e inspecionável (`.mock.calls`). */
function makeNext(): NextSpy {
  return vi.fn() as unknown as NextSpy;
}

/** Garante que o middleware chamou `next` uma única vez, com o erro esperado. */
function expectNextError(next: NextSpy, expected: Record<string, unknown>): void {
  expect(next).toHaveBeenCalledOnce();
  expect(next.mock.calls[0]?.[0]).toMatchObject(expected);
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("authMiddleware", () => {
  it("rejeita requisição sem cookie (401)", async () => {
    const next = makeNext();
    await authMiddleware(makeReq(), makeRes(), next);

    expectNextError(next, { statusCode: 401, message: "Token não fornecido" });
  });

  it("popula req.user a partir do estado no banco (papel vem do banco, não do JWT)", async () => {
    const next = makeNext();
    const token = makeToken({
      role: "Solicitante",
      password_changed_at: new Date("2026-01-01T00:00:00.000Z").getTime(),
    });
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ profile_name: "analista" }),
    );

    const req = makeReq({ cookies: { session_id: token } });
    await authMiddleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ id: "1", role: "Analista" });
    expect(req.authScope).toBe("session");
  });

  it("bloqueia rotas fora de /auth/me e /auth/change-password quando must_change_password", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ must_change_password: true }),
    );

    await authMiddleware(
      makeReq({ cookies: { session_id: makeToken() }, originalUrl: "/requests" }),
      makeRes(),
      next,
    );
    expectNextError(next, { statusCode: 403 });
  });

  it("libera /auth/me durante a troca de senha obrigatória", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ must_change_password: true }),
    );

    await authMiddleware(
      makeReq({ cookies: { session_id: makeToken() }, originalUrl: "/auth/me?x=1" }),
      makeRes(),
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("libera /auth/change-password e propaga o escopo change_password", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ must_change_password: true }),
    );
    const req = makeReq({
      cookies: { session_id: makeToken({ scope: "change_password" }) },
      originalUrl: "/auth/change-password?x=1",
    });

    await authMiddleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(req.authScope).toBe("change_password");
  });

  it("revoga tokens emitidos antes de uma troca de senha (401)", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ password_changed_at: new Date("2026-06-06T00:00:00.000Z") }),
    );

    await authMiddleware(
      makeReq({
        cookies: {
          session_id: makeToken({
            password_changed_at: new Date("2026-01-01T00:00:00.000Z").getTime(),
          }),
        },
      }),
      makeRes(),
      next,
    );
    expectNextError(next, {
      statusCode: 401,
      message: "Sua sessão foi revogada. Faça login novamente.",
    });
  });

  it("rejeita usuário inativo com 401 e mensagem anti-enumeração", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState({ is_active: false }));

    await authMiddleware(makeReq({ cookies: { session_id: makeToken() } }), makeRes(), next);
    expectNextError(next, { statusCode: 401, message: "Token inválido ou expirado" });
  });

  it("rejeita perfil inativo com 401 e mensagem anti-enumeração", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(
      makeAuthState({ profile_is_active: false }),
    );

    await authMiddleware(makeReq({ cookies: { session_id: makeToken() } }), makeRes(), next);
    expectNextError(next, { statusCode: 401, message: "Token inválido ou expirado" });
  });

  it("rejeita quando o usuário não existe mais no banco (401)", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(undefined);

    await authMiddleware(makeReq({ cookies: { session_id: makeToken() } }), makeRes(), next);
    expectNextError(next, { statusCode: 401, message: "Token inválido ou expirado" });
  });

  it("rejeita token expirado (401)", async () => {
    const next = makeNext();

    await authMiddleware(makeReq({ cookies: { session_id: makeExpiredToken() } }), makeRes(), next);
    expectNextError(next, { statusCode: 401, message: "Token inválido ou expirado" });
  });

  it("rejeita token adulterado (401)", async () => {
    const next = makeNext();

    await authMiddleware(
      makeReq({ cookies: { session_id: makeTamperedToken() } }),
      makeRes(),
      next,
    );
    expectNextError(next, { statusCode: 401, message: "Token inválido ou expirado" });
  });

  it("encaminha erro inesperado do banco uma única vez", async () => {
    const next = makeNext();
    const dbError = new Error("banco indisponível");
    vi.mocked(authRepository.getAuthState).mockRejectedValue(dbError);

    await authMiddleware(makeReq({ cookies: { session_id: makeToken() } }), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toBe(dbError);
  });
});

describe("requireRole", () => {
  it("libera quando o papel está na lista", () => {
    const next = makeNext();
    const req = makeReq({
      user: { id: "1", name: "x", email: "x@x.com", role: "Analista" },
      authScope: "session",
    });

    requireRole("Analista", "Administrador")(req, makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("nega papel não autorizado e sessão de troca de senha", () => {
    const denied = makeNext();
    requireRole("Administrador")(
      makeReq({
        user: { id: "1", name: "x", email: "x@x.com", role: "Analista" },
        authScope: "session",
      }),
      makeRes(),
      denied,
    );
    expectNextError(denied, { statusCode: 403 });

    const pending = makeNext();
    requireRole("Analista")(
      makeReq({
        user: { id: "1", name: "x", email: "x@x.com", role: "Analista" },
        authScope: "change_password",
      }),
      makeRes(),
      pending,
    );
    expectNextError(pending, { statusCode: 403 });
  });
});

describe("requesterDualAuth", () => {
  it("sem cookie e sem header de identidade → 401", () => {
    const next = makeNext();
    requesterDualAuth(makeReq(), makeRes(), next);
    expectNextError(next, { statusCode: 401 });
  });

  it("rejeita header de identidade malformado ou sem os campos obrigatórios", () => {
    for (const identity of [
      "{invalido",
      JSON.stringify({ name: "Maria" }),
      JSON.stringify({ email: "maria@neo.com" }),
      JSON.stringify({ name: 1, email: "maria@neo.com" }),
      JSON.stringify({ name: "Maria", email: "nao-email" }),
    ]) {
      const next = makeNext();
      requesterDualAuth(
        makeReq({ headers: { "x-requester-identity": identity } }),
        makeRes(),
        next,
      );
      expectNextError(next, { statusCode: 401 });
    }
  });

  it("com header X-Requester-Identity válido, marca a identidade no request", () => {
    const next = makeNext();
    const req = makeReq({
      headers: {
        "x-requester-identity": JSON.stringify({ name: "Maria", email: "maria@neo.com" }),
      },
      params: { protocol: "MAAT-ABCD-EFGH" },
    });

    requesterDualAuth(req, makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(req.requesterIdentity).toEqual({ name: "Maria", email: "maria@neo.com" });
    expect(req.requesterVerifiedProtocol).toBe("MAAT-ABCD-EFGH");
  });

  it("com cookie de sessão delega ao authMiddleware", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState());

    await requesterDualAuth(makeReq({ cookies: { session_id: makeToken() } }), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });
});

describe("requireAccessMode", () => {
  it("modo PUBLIC libera sem autenticação", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("PUBLIC");
    const next = makeNext();
    const req = makeReq();

    await requireAccessMode()(req, makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(req.accessMode).toBe("PUBLIC");
  });

  it("modo AUTHENTICATED delega ao authMiddleware (401 sem cookie)", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");
    const next = makeNext();

    await requireAccessMode()(makeReq(), makeRes(), next);
    expectNextError(next, { statusCode: 401 });
  });

  it("modo AUTHENTICATED libera com sessão válida e marca o accessMode", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState());
    const next = makeNext();
    const req = makeReq({ cookies: { session_id: makeToken() } });

    await requireAccessMode()(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(req.accessMode).toBe("AUTHENTICATED");
    expect(req.user).toMatchObject({ id: "1" });
  });

  it("encaminha erro ao ler o modo do banco", async () => {
    const next = makeNext();
    const dbError = new Error("settings indisponível");
    vi.mocked(portalConfigRepository.getSolicitationMode).mockRejectedValue(dbError);

    await requireAccessMode()(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toBe(dbError);
  });
});
