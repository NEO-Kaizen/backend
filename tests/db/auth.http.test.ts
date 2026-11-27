import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEffectivePermissions,
  PERMISSION_CATALOG,
} from "../../src/shared/catalog/permissionCatalog.ts";
import { PROFILE_IDS } from "../helpers/factories.ts";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";
import { closeTestDb, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const usersService = await import("../../src/modules/users/users.service.ts");

const PASSWORD = "SenhaAtual@123";
const NEW_PASSWORD = "NovaSenha@456";

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

/** Perfis base são persistidos com o rótulo de exibição (`profiles.name`). */
async function insertAdminUser() {
  return insertUser({
    email: "admin@neo.com",
    profileName: "Administrador",
  });
}

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(async () => {
  await resetTestDb();
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(async () => {
  await server.close();
  await closeTestDb();
});

describe("HTTP real — autenticação e sessão", () => {
  it("faz login, consulta a sessão, troca a senha e aceita apenas a nova senha", async () => {
    const user = await insertUser({
      email: "maria@neo.com",
      password: PASSWORD,
      profileName: "Analista",
    });
    const client = new TestClient(server.baseUrl);

    const login = await client.post("/auth/login", {
      email: "  MARIA@neo.com ",
      password: PASSWORD,
    });

    expect(login.status).toBe(200);
    expect(login.headers.get("content-type")).toContain("application/json");
    expect(login.body).toMatchObject({
      email: "maria@neo.com",
      profile: { id: String(PROFILE_IDS.Analista), name: "Analista", isRoot: false },
    });

    const cookie = client.getCookie("session_id");
    expect(cookie).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/",
    });
    const oldToken = cookie?.value;
    expect(oldToken).toBeTruthy();

    const me = await client.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ id: String(user.user_id), email: "maria@neo.com" });

    const changed = await client.put("/auth/change-password", {
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmNewPassword: NEW_PASSWORD,
    });
    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({ mustChangePassword: false });

    // O cookie emitido antes da troca perde validade imediatamente.
    const oldSession = new TestClient(server.baseUrl);
    const revoked = await oldSession.get("/auth/me", {
      cookie: `session_id=${oldToken}`,
    });
    expect(revoked.status).toBe(401);
    expect(revoked.body).toMatchObject({
      statusCode: 401,
      message: "Sua sessão foi revogada. Faça login novamente.",
    });

    await client.post("/auth/logout");
    expect(client.cookieHeader).toBe("");

    const oldPassword = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: PASSWORD,
    });
    expect(oldPassword.status).toBe(401);

    const newPassword = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: NEW_PASSWORD,
    });
    expect(newPassword.status).toBe(200);

    const audits = await testDb("audit_history").where({
      action_type: "user.change_password",
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      entity_type: "user",
      entity_id: String(user.user_id),
      user_id: user.user_id,
    });
  });

  it("revoga a sessão antiga após reset administrativo de senha", async () => {
    const admin = await insertAdminUser();
    const target = await insertUser({
      email: "alvo@neo.com",
      password: PASSWORD,
      profileName: "Solicitante",
    });
    const client = new TestClient(server.baseUrl);

    const login = await client.post("/auth/login", {
      email: "alvo@neo.com",
      password: PASSWORD,
    });
    expect(login.status).toBe(200);
    const oldToken = client.getCookie("session_id")?.value;
    expect(oldToken).toBeTruthy();

    const reset = await usersService.resetPassword(
      String(target.user_id),
      { id: admin.user_id, permissions: ADMIN_PERMISSIONS },
      "203.0.113.70",
    );

    const oldSession = new TestClient(server.baseUrl);
    const revoked = await oldSession.get("/auth/me", {
      cookie: `session_id=${oldToken}`,
    });
    expect(revoked.status).toBe(401);
    expect(revoked.body).toMatchObject({
      message: "Sua sessão foi revogada. Faça login novamente.",
    });

    const withTemporary = await new TestClient(server.baseUrl).post("/auth/login", {
      email: "alvo@neo.com",
      password: reset.temporaryPassword,
    });
    expect(withTemporary.status).toBe(200);
    expect(withTemporary.body).toMatchObject({ mustChangePassword: true });
  });

  it("devolve envelope de erro para credenciais inválidas", async () => {
    await insertUser({ email: "maria@neo.com", password: PASSWORD, profileName: "Analista" });
    const client = new TestClient(server.baseUrl);

    const response = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: "errada",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Credenciais inválidas",
    });
  });
});
