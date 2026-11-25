import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  makeAuthState,
  makeToken,
  makeUserPage,
  makeUserRow,
  makeUserSummary,
} from "../helpers/factories.ts";
import {
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { fakeDbState, resetFakeDb } from "../helpers/fakeDb.ts";

// Foco no wiring de autenticação/autorização de `/users`; service e repository
// são mockados. Persistência real em `tests/db/users.service.test.ts`.
vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
}));

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
  upsertRequesterData: vi.fn(),
  deleteProfessionalData: vi.fn(),
  removeUserAvatar: vi.fn(),
  setUserAvatar: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const repository = await import("../../src/modules/users/users.repository.ts");

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

afterAll(async () => {
  await server.close();
});

async function session(
  profileName: "solicitante" | "analista" | "gestor" | "administrador",
): Promise<Record<string, string>> {
  vi.mocked(authRepository.getAuthState).mockResolvedValue(
    makeAuthState({ profile_name: profileName }),
  );

  return { cookie: `session_id=${makeToken()}` };
}

describe("E2E — autorização de /users", () => {
  it("exige sessão para qualquer rota de usuários", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users?page=1");
    expectErrorEnvelope(response, { statusCode: 401 });
  });

  it("impede Solicitante de listar usuários", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users?page=1", await session("solicitante"));
    expectErrorEnvelope(response, { statusCode: 403 });
    expect(repository.listUsers).not.toHaveBeenCalled();
  });

  it("permite Administrador listar usuários e devolve a paginação", async () => {
    vi.mocked(repository.listUsers).mockResolvedValue(makeUserPage());
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users?page=1&pageSize=10", await session("administrador"));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [makeUserSummary()],
      page: 1,
      total: 1,
    });
    expect(repository.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10 }),
    );
  });

  it("permite Administrador criar usuário e audita a operação", async () => {
    vi.mocked(repository.findProfileIdByName).mockResolvedValue(1);
    vi.mocked(repository.isProfessionalProfile).mockReturnValue(false);
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

    const client = new TestClient(server.baseUrl);
    const response = await client.post(
      "/users",
      {
        fullName: "Novo Usuário",
        email: "novo@neo.com",
        role: "solicitante",
        requester: {
          area: "Financeiro",
          manager: "Gestor",
          additionalContact: "11999999999",
        },
      },
      await session("administrador"),
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "10",
      email: "novo@neo.com",
      role: "Solicitante",
      mustChangePassword: true,
    });
    expect(repository.createRequesterData).toHaveBeenCalledOnce();
    expect(fakeDbState.auditRows[0]).toMatchObject({
      action_type: "user.create",
      entity_id: "10",
      change_origin: "admin",
    });
  });

  it("libera /users/me para qualquer perfil interno", async () => {
    vi.mocked(repository.findUserProfile).mockResolvedValue({
      user_id: 7,
      full_name: "Maria",
      email: "maria@neo.com",
      avatar_url: null,
      profile_name: "solicitante",
      requester: {
        area: "Financeiro",
        department: null,
        manager_name: "Gestor",
        additional_contact: null,
      },
      professional: null,
    });

    const client = new TestClient(server.baseUrl);
    const response = await client.get("/users/me", await session("solicitante"));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "7", role: "Solicitante" });
  });

  it("libera a lista de analistas para perfis internos autenticados", async () => {
    vi.mocked(repository.listAnalysts).mockResolvedValue([]);
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users/analysts", await session("analista"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(repository.listAnalysts).toHaveBeenCalledOnce();
  });
});
