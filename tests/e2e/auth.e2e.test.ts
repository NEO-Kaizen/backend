import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";
import { makeAuthState, makeAuthUser } from "../helpers/factories.ts";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";

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

const PASSWORD = "SenhaAtual@123";
const T0 = new Date("2026-01-01T00:00:00.000Z");
const T1 = new Date("2026-06-06T00:00:00.000Z");

let server: TestServer;
let passwordHash: string;

/** Estado de autenticação corrente devolvido pelo `authMiddleware`. */
let currentPasswordChangedAt = T0;

beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD);
  server = await startTestServer();
});

afterEach(() => {
  vi.clearAllMocks();
  currentPasswordChangedAt = T0;
});

function mockAuthState() {
  vi.mocked(authRepository.getAuthState).mockImplementation(async () =>
    makeAuthState({ password_changed_at: currentPasswordChangedAt }),
  );
  // GET /auth/me relê o usuário no banco via getSessionUser → findUserById.
  vi.mocked(authRepository.findUserById).mockResolvedValue(
    makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
  );
}

describe("E2E — fluxo de autenticação", () => {
  it("faz login, consulta a sessão e encerra com logout", async () => {
    mockAuthState();
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
    );

    const client = new TestClient(server.baseUrl);

    const login = await client.post("/auth/login", {
      email: "  MARIA@neo.com ",
      password: PASSWORD,
    });
    
    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({
      email: "maria@neo.com",
      role: "Analista",
      mustChangePassword: false,
    });
    expect(client.cookieHeader).toContain("session_id=");

    const me = await client.get<{ role: string }>("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.role).toBe("Analista");

    const logout = await client.post("/auth/logout");
    expect(logout.status).toBe(200);
    expect(client.cookieHeader).not.toContain("session_id=");

    const meAfterLogout = await client.get("/auth/me");
    expect(meAfterLogout.status).toBe(401);
  });

  it("rejeita login com senha incorreta (401, mensagem genérica)", async () => {
    mockAuthState();
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
    );

    const client = new TestClient(server.baseUrl);
    const response = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: "errada",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ message: "Credenciais inválidas" });
  });

  it("valida o corpo do login (400 em payload inválido)", async () => {
    const client = new TestClient(server.baseUrl);
    const response = await client.post("/auth/login", { email: "nao-email", password: "" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("revoga o token quando password_changed_at diverge (troca externa)", async () => {
    mockAuthState();
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
    );

    const client = new TestClient(server.baseUrl);
    await client.post("/auth/login", { email: "maria@neo.com", password: PASSWORD });
    expect((await client.get("/auth/me")).status).toBe(200);

    // Simula redefinição de senha por outro caminho (admin reset).
    currentPasswordChangedAt = T1;

    const revoked = await client.get("/auth/me");
    expect(revoked.status).toBe(401);
    expect(revoked.body).toMatchObject({
      message: "Sua sessão foi revogada. Faça login novamente.",
    });
  });

  it("troca a senha e renova o cookie de sessão", async () => {
    mockAuthState();
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
    );
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
    );
    vi.mocked(authRepository.changePassword).mockImplementation(async () => {
      currentPasswordChangedAt = T1;
      return { password_changed_at: T1 };
    });

    const client = new TestClient(server.baseUrl);
    await client.post("/auth/login", { email: "maria@neo.com", password: PASSWORD });

    const changed = await client.put("/auth/change-password", {
      currentPassword: PASSWORD,
      newPassword: "NovaSenha@456",
      confirmNewPassword: "NovaSenha@456",
    });

    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({ mustChangePassword: false });
    // O novo cookie (T1) continua válido.
    expect((await client.get("/auth/me")).status).toBe(200);
  });
});
