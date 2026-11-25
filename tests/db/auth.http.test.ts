import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";
import { closeTestDb, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const PASSWORD = "SenhaAtual@123";
const NEW_PASSWORD = "NovaSenha@456";

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
      profileName: "analista",
    });
    const client = new TestClient(server.baseUrl);

    const login = await client.post("/auth/login", {
      email: "  MARIA@neo.com ",
      password: PASSWORD,
    });

    expect(login.status).toBe(200);
    expect(login.headers.get("content-type")).toContain("application/json");
    expect(login.body).toMatchObject({ email: "maria@neo.com", role: "Analista" });

    const cookie = client.getCookie("session_id");
    expect(cookie).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/",
    });

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

  it("devolve envelope de erro para credenciais inválidas", async () => {
    await insertUser({ email: "maria@neo.com", password: PASSWORD });
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
