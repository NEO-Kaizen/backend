import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";
import { makeAuthState, makeAuthUser } from "../helpers/factories.ts";
import { resetFakeDb } from "../helpers/fakeDb.ts";
import {
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";

// Contrato HTTP com a persistência mockada. A mesma jornada com Postgres real
// (hash, transação e auditoria) está em `tests/db/auth.http.test.ts`.
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
const NEW_PASSWORD = "NovaSenha@456";
const T0 = new Date("2026-01-01T00:00:00.000Z");
const T1 = new Date("2026-06-06T00:00:00.000Z");

let server: TestServer;
let passwordHash: string;
let currentPasswordChangedAt = T0;

beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD);
  server = await startTestServer();
});

beforeEach(() => {
  vi.resetAllMocks();
  currentPasswordChangedAt = T0;
  passwordHash = "";
});

afterEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

afterAll(async () => {
  await server.close();
});

async function mockCurrentUser() {
  passwordHash = passwordHash || (await hashPassword(PASSWORD));

  vi.mocked(authRepository.getAuthState).mockImplementation(async () =>
    makeAuthState({ password_changed_at: currentPasswordChangedAt }),
  );
  vi.mocked(authRepository.findUserByEmail).mockImplementation(async () =>
    makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
  );
  vi.mocked(authRepository.findUserById).mockImplementation(async () =>
    makeAuthUser({ email: "maria@neo.com", password_hash: passwordHash }),
  );
}

describe("E2E — fluxo de autenticação", () => {
  it("faz login, consulta a sessão e encerra com logout", async () => {
    await mockCurrentUser();
    const client = new TestClient(server.baseUrl);

    const login = await client.post("/auth/login", {
      email: "  MARIA@neo.com ",
      password: PASSWORD,
    });

    expect(login.status).toBe(200);
    expect(login.headers.get("content-type")).toContain("application/json");
    expect(login.body).toMatchObject({
      email: "maria@neo.com",
      role: "Analista",
      mustChangePassword: false,
    });
    expect(client.getCookie("session_id")).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/",
    });

    const me = await client.get<{ role: string }>("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.role).toBe("Analista");

    const logout = await client.post("/auth/logout");
    expect(logout.status).toBe(200);
    expect(client.cookieHeader).not.toContain("session_id=");

    const meAfterLogout = await client.get("/auth/me");
    expectErrorEnvelope(meAfterLogout, { statusCode: 401 });
  });

  it("rejeita login com senha incorreta (401, mensagem genérica)", async () => {
    await mockCurrentUser();
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: "errada",
    });

    expectErrorEnvelope(response, { statusCode: 401, message: "Credenciais inválidas" });
  });

  it("valida o corpo do login (400 em payload inválido)", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/auth/login", { email: "nao-email", password: "" });

    expectErrorEnvelope(response, { statusCode: 400, message: /Campos inválidos/ });
  });

  it("revoga o token quando password_changed_at diverge (troca externa)", async () => {
    await mockCurrentUser();
    const client = new TestClient(server.baseUrl);

    await client.post("/auth/login", { email: "maria@neo.com", password: PASSWORD });
    expect((await client.get("/auth/me")).status).toBe(200);

    // Simula redefinição de senha por outro caminho (admin reset).
    currentPasswordChangedAt = T1;

    const revoked = await client.get("/auth/me");
    expectErrorEnvelope(revoked, {
      statusCode: 401,
      message: "Sua sessão foi revogada. Faça login novamente.",
    });
  });

  it("troca a senha e aceita somente a nova senha no próximo login", async () => {
    await mockCurrentUser();
    vi.mocked(authRepository.changePassword).mockImplementation(
      async (_trx, _id, newPasswordHash) => {
        passwordHash = newPasswordHash;
        currentPasswordChangedAt = T1;
        return { password_changed_at: T1 };
      },
    );

    const client = new TestClient(server.baseUrl);
    await client.post("/auth/login", { email: "maria@neo.com", password: PASSWORD });

    const changed = await client.put("/auth/change-password", {
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmNewPassword: NEW_PASSWORD,
    });

    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({ mustChangePassword: false });
    // O novo cookie (T1) continua válido.
    expect((await client.get("/auth/me")).status).toBe(200);

    await client.post("/auth/logout");

    const oldPassword = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: PASSWORD,
    });
    expectErrorEnvelope(oldPassword, { statusCode: 401, message: "Credenciais inválidas" });

    const newPassword = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: NEW_PASSWORD,
    });
    expect(newPassword.status).toBe(200);
  });
});
