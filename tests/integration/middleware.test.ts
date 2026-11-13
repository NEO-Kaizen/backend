import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { makeAuthState, makeToken } from "../helpers/factories.ts";

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

const res = {} as Response;

type NextSpy = ReturnType<typeof vi.fn> & NextFunction;

/** `next()` tipado como `NextFunction` e inspecionável (`.mock.calls`). */
function makeNext(): NextSpy {
  return vi.fn() as unknown as NextSpy;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("authMiddleware", () => {
  it("rejeita requisição sem cookie (401)", async () => {
    const next = makeNext();
    await authMiddleware(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 401,
      message: "Token não fornecido",
    });
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
    await authMiddleware(req, res, next);

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
      res,
      next,
    );
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403 });
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
      res,
      next,
    );
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 401,
      message: "Sua sessão foi revogada. Faça login novamente.",
    });
  });

  it("rejeita usuário/perfil inativo com 401", async () => {
    const next = makeNext();
    vi.mocked(authRepository.getAuthState).mockResolvedValue(makeAuthState({ is_active: false }));

    await authMiddleware(makeReq({ cookies: { session_id: makeToken() } }), res, next);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 401 });
  });
});

describe("requireRole", () => {
  it("libera quando o papel está na lista", () => {
    const next = makeNext();
    const req = makeReq({
      user: { id: "1", name: "x", email: "x@x.com", role: "Analista" },
      authScope: "session",
    });

    requireRole("Analista", "Administrador")(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("nega papel não autorizado e sessão de troca de senha", () => {
    const denied = makeNext();
    requireRole("Administrador")(
      makeReq({
        user: { id: "1", name: "x", email: "x@x.com", role: "Analista" },
        authScope: "session",
      }),
      res,
      denied,
    );
    expect(denied.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403 });

    const pending = makeNext();
    requireRole("Analista")(
      makeReq({
        user: { id: "1", name: "x", email: "x@x.com", role: "Analista" },
        authScope: "change_password",
      }),
      res,
      pending,
    );
    expect(pending.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403 });
  });
});

describe("requesterDualAuth", () => {
  it("sem cookie e sem header de identidade → 401", () => {
    const next = makeNext();
    requesterDualAuth(makeReq(), res, next);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 401 });
  });

  it("com header X-Requester-Identity válido, marca a identidade no request", () => {
    const next = makeNext();
    const req = makeReq({
      headers: {
        "x-requester-identity": JSON.stringify({ name: "Maria", email: "maria@neo.com" }),
      },
      params: { protocol: "MAAT-ABCD-EFGH" },
    });

    requesterDualAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.requesterIdentity).toEqual({ name: "Maria", email: "maria@neo.com" });
    expect(req.requesterVerifiedProtocol).toBe("MAAT-ABCD-EFGH");
  });
});

describe("requireAccessMode", () => {
  it("modo PUBLIC libera sem autenticação", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("PUBLIC");
    const next = makeNext();
    const req = makeReq();

    await requireAccessMode()(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.accessMode).toBe("PUBLIC");
  });

  it("modo AUTHENTICATED delega ao authMiddleware (401 sem cookie)", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");
    const next = makeNext();

    await requireAccessMode()(makeReq(), res, next);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 401 });
  });
});
