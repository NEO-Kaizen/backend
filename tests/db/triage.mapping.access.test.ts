import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupTestUploads,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import {
  closeTestDb,
  DEFAULT_TEST_PASSWORD,
  insertUser,
  resetTestDb,
  testDb,
} from "../helpers/testDb.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

const PROTOCOL = "CUST-0001";

let server: TestServer;
let triageClient: TestClient;
let mappingClient: TestClient;
let managerClient: TestClient;

async function login(email: string): Promise<TestClient> {
  const client = new TestClient(server.baseUrl);
  const response = await client.post("/auth/login", {
    email,
    password: DEFAULT_TEST_PASSWORD,
  });
  expect(response.status).toBe(200);
  return client;
}

async function insertProfessional(userId: number, jobTitle: string): Promise<string> {
  const [row] = (await testDb("details_professional")
    .insert({ user_id: userId, job_title: jobTitle })
    .returning("professional_id")) as Array<{ professional_id: string }>;

  if (!row) throw new Error("Falha ao inserir profissional de teste.");
  return row.professional_id;
}

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(async () => {
  await resetTestDb();

  const status = await testDb("statuses").where({ name: "Em triagem" }).first("status_id");
  const category = await testDb("categories").first("category_id");
  if (!status || !category) throw new Error("Dados de referência ausentes no banco de teste.");

  const triageUser = await insertUser({ email: "triagem@neo.com", fullName: "Triagem" });
  const mappingUser = await insertUser({ email: "mapeamento@neo.com", fullName: "Mapeamento" });
  await insertUser({ email: "gestor@neo.com", fullName: "Gestor", profileName: "gestor" });

  const triageProfessionalId = await insertProfessional(triageUser.user_id, "Analista");
  const mappingProfessionalId = await insertProfessional(mappingUser.user_id, "Analista");

  const [requester] = (await testDb("requesters")
    .insert({
      full_name: "Solicitante de Teste",
      corporate_email: "solicitante@neo.com",
      area: "TI",
      department: "Desenvolvimento",
      manager_name: "Gestor de Teste",
    })
    .returning("requester_id")) as Array<{ requester_id: string }>;

  if (!requester) throw new Error("Falha ao inserir solicitante de teste.");

  await testDb("requests").insert({
    request_id: 9101,
    protocol: PROTOCOL,
    requester_id: requester.requester_id,
    category_id: category.category_id,
    status_id: status.status_id,
    professional_id: triageProfessionalId,
    mapping_professional_id: mappingProfessionalId,
    title: "Titulo de Teste",
    request_type: "Automação",
    process_name: "Processo de Teste",
    need_description: "Necessidade de teste.",
    problem_opportunity: "Problema de teste.",
    expected_result: "Resultado de teste.",
    justification: "Justificativa do teste.",
    process_description: "Descrição operacional.",
    process_steps: "Passo 1; passo 2.",
    systems_used: "Sistema de teste",
    execution_frequency: "Diário",
    approximate_volume: "100/dia",
    people_involved: 2,
    average_duration: "1h",
    estimated_monthly_effort: 10,
    has_manual_controls: false,
    main_risks: "Riscos de teste.",
    client_impact: "Impacto de teste.",
    operational_impact: "Médio",
    desired_deadline: "2099-12-31",
    perceived_criticality: "Alta",
    created_by: "teste@neo.com",
  });

  triageClient = await login("triagem@neo.com");
  mappingClient = await login("mapeamento@neo.com");
  managerClient = await login("gestor@neo.com");
});

afterAll(async () => {
  await server.close();
  await cleanupTestUploads();
  await closeTestDb();
});

describe("HTTP real — leitura simétrica de Triagem e Mapeamento", () => {
  it("responsável da triagem lê o mapeamento em somente leitura", async () => {
    const mapping = await triageClient.get(`/queue/requests/${PROTOCOL}/mapping`);

    expect(mapping.status).toBe(200);
  });

  it("designado do mapeamento lê a triagem em somente leitura", async () => {
    const triage = await mappingClient.get(`/requests/${PROTOCOL}/triage`);

    expect(triage.status).toBe(200);
  });

  it("Visualizador lê as duas etapas", async () => {
    const triage = await managerClient.get(`/requests/${PROTOCOL}/triage`);
    const mapping = await managerClient.get(`/queue/requests/${PROTOCOL}/mapping`);

    expect(triage.status).toBe(200);
    expect(mapping.status).toBe(200);
  });
});

describe("HTTP real — escrita permanece exclusiva da etapa", () => {
  it("responsável da triagem não edita o mapeamento", async () => {
    const response = await triageClient.put(`/queue/requests/${PROTOCOL}/mapping`, {
      notes: "Tentativa da triagem.",
      completeMapping: false,
    });

    expect(response.status).toBe(403);
  });

  it("Visualizador não edita o mapeamento", async () => {
    const response = await managerClient.put(`/queue/requests/${PROTOCOL}/mapping`, {
      notes: "Tentativa do Visualizador.",
      completeMapping: false,
    });

    expect(response.status).toBe(403);
  });
});

describe("HTTP real — auditoria x timeline da solicitação", () => {
  it("Analista lê a timeline da solicitação, mas não a listagem de auditoria", async () => {
    const timeline = await triageClient.get(`/audit-logs/${PROTOCOL}`);
    const listing = await triageClient.get("/audit-history?page=1&limit=10");

    expect(timeline.status).toBe(200);
    expect(listing.status).toBe(403);
  });

  it("designado do mapeamento lê a timeline da solicitação", async () => {
    const timeline = await mappingClient.get(`/audit-logs/${PROTOCOL}`);

    expect(timeline.status).toBe(200);
  });

  it("Visualizador lê a listagem de auditoria e a timeline", async () => {
    const listing = await managerClient.get("/audit-history?page=1&limit=10");
    const timeline = await managerClient.get(`/audit-logs/${PROTOCOL}`);

    expect(listing.status).toBe(200);
    expect(timeline.status).toBe(200);
  });
});
