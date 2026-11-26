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

let server: TestServer;
let client: TestClient;

/**
 * Fuso comercial é UTC-3. Os instantes abaixo caem exatamente nas bordas do
 * dia: 02:00Z é 23:00 do dia anterior e 03:00Z é 00:00 do dia seguinte.
 * `dateFrom`/`dateTo` são inclusivos no dia comercial, não em UTC.
 */
const REQUESTS = [
  { protocol: "TESTE-0001", createdAt: "2026-11-01T02:00:00Z", department: "Desenvolvimento" },
  { protocol: "TESTE-0002", createdAt: "2026-11-01T03:00:00Z", department: "desenvolvimento" },
  { protocol: "TESTE-0003", createdAt: "2026-11-02T02:59:00Z", department: "Financeiro" },
  { protocol: "TESTE-0004", createdAt: "2026-11-02T03:00:00Z", department: "Desenvolvimento" },
] as const;

async function seedQueue(): Promise<void> {
  const status = await testDb("statuses").where({ name: "Aguardando triagem" }).first("status_id");
  const category = await testDb("categories").first("category_id");

  if (!status || !category) throw new Error("Dados de referência ausentes no banco de teste.");

  for (const [index, item] of REQUESTS.entries()) {
    const [requester] = (await testDb("requesters")
      .insert({
        full_name: `Solicitante ${index + 1}`,
        corporate_email: `solicitante${index + 1}@neo.com`,
        area: "TI",
        department: item.department,
        manager_name: "Gestor de Teste",
      })
      .returning("requester_id")) as Array<{ requester_id: string }>;

    if (!requester) throw new Error("Falha ao inserir solicitante de teste.");

    await testDb("requests").insert({
      request_id: 9001 + index,
      protocol: item.protocol,
      requester_id: requester.requester_id,
      category_id: category.category_id,
      status_id: status.status_id,
      title: "Solicitação de teste",
      request_type: "Automação",
      process_name: "Processo de teste",
      need_description: "Descrição da necessidade.",
      problem_opportunity: "Descrição do problema.",
      expected_result: "Resultado esperado.",
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
      created_at: item.createdAt,
    });
  }
}

interface QueueResponse {
  data: Array<{ protocol: string }>;
  total: number;
}

async function listQueue(query: string): Promise<QueueResponse> {
  const response = await client.get<QueueResponse>(`/queue?page=1&pageSize=10&${query}`);
  expect(response.status).toBe(200);
  return response.body;
}

function queueProtocols(queue: QueueResponse): string[] {
  return queue.data.map((item) => item.protocol);
}

function protocols(queue: QueueResponse): string[] {
  // A ordem da fila é verificada em testes de ordenação; aqui só importa o conjunto.
  return queueProtocols(queue).sort();
}

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(async () => {
  await resetTestDb();
  await seedQueue();
  await insertUser({ email: "gestor@neo.com", profileName: "gestor" });

  client = new TestClient(server.baseUrl);
  const login = await client.post("/auth/login", {
    email: "gestor@neo.com",
    password: DEFAULT_TEST_PASSWORD,
  });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await server.close();
  await cleanupTestUploads();
  await closeTestDb();
});

describe("HTTP real — filtros de data e departamento na fila", () => {
  it("dateFrom usa o começo do dia comercial, não o instante UTC", async () => {
    const queue = await listQueue("dateFrom=2026-11-01");

    expect(queue.total).toBe(3);
    expect(protocols(queue)).toEqual(["TESTE-0002", "TESTE-0003", "TESTE-0004"]);
  });

  it("dateTo isolado inclui o último minuto do dia comercial", async () => {
    const queue = await listQueue("dateTo=2026-10-31");

    expect(queue.total).toBe(1);
    expect(protocols(queue)).toEqual(["TESTE-0001"]);
  });

  it("dateTo exclui o primeiro minuto do dia seguinte", async () => {
    const queue = await listQueue("dateTo=2026-11-01");

    expect(queue.total).toBe(3);
    expect(protocols(queue)).toEqual(["TESTE-0001", "TESTE-0002", "TESTE-0003"]);
  });

  it("department compara de forma exata e case-insensitive", async () => {
    const queue = await listQueue("department=DESENVOLVIMENTO");

    expect(queue.total).toBe(3);
    expect(protocols(queue)).toEqual(["TESTE-0001", "TESTE-0002", "TESTE-0004"]);
  });

  it("department sem correspondência devolve zero resultados", async () => {
    const queue = await listQueue("department=Inexistente");

    expect(queue.total).toBe(0);
    expect(queue.data).toEqual([]);
  });

  it("combina data e departamento com AND", async () => {
    const queue = await listQueue(
      "dateFrom=2026-11-01&dateTo=2026-11-01&department=desenvolvimento",
    );

    expect(queue.total).toBe(1);
    expect(protocols(queue)).toEqual(["TESTE-0002"]);
  });

  it("recusa data inválida com 400", async () => {
    const response = await client.get("/queue?page=1&pageSize=10&dateFrom=2026-11-31");

    expect(response.status).toBe(400);
  });
});

describe("HTTP real — ordenação por domínio", () => {
  it("ordena status pelo ciclo de vida e prioridade pela gravidade, com nulos no fim", async () => {
    const statusIds = Object.fromEntries(
      (
        await testDb("statuses")
          .whereIn("name", ["Solicitação enviada", "Aguardando triagem", "Em triagem"])
          .select("name", "status_id")
      ).map((row) => [row.name, row.status_id]),
    );
    const priorityIds = Object.fromEntries(
      (
        await testDb("priorities")
          .whereIn("level", ["Baixa", "Média", "Crítica"])
          .select("level", "priority_id")
      ).map((row) => [row.level, row.priority_id]),
    );

    await testDb("requests")
      .where({ protocol: "TESTE-0001" })
      .update({ status_id: statusIds["Aguardando triagem"], priority_id: priorityIds["Média"] });
    await testDb("requests")
      .where({ protocol: "TESTE-0002" })
      .update({ status_id: statusIds["Em triagem"], priority_id: priorityIds["Crítica"] });
    await testDb("requests")
      .where({ protocol: "TESTE-0003" })
      .update({ status_id: statusIds["Solicitação enviada"], priority_id: priorityIds["Baixa"] });

    const byStatus = await listQueue("sortBy=status&sortOrder=asc");
    expect(queueProtocols(byStatus)).toEqual([
      "TESTE-0003",
      "TESTE-0001",
      "TESTE-0004",
      "TESTE-0002",
    ]);

    const byPriority = await listQueue("sortBy=priority&sortOrder=desc");
    expect(queueProtocols(byPriority)).toEqual([
      "TESTE-0002",
      "TESTE-0001",
      "TESTE-0003",
      "TESTE-0004",
    ]);
  });
});

describe("HTTP real — exportação CSV com os filtros compartilhados", () => {
  it("exporta apenas as solicitações do recorte", async () => {
    const response = await client.get(
      "/reports/requests.csv?dateFrom=2026-11-01&dateTo=2026-11-01&department=desenvolvimento",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.text).toContain("TESTE-0002");
    expect(response.text).not.toContain("TESTE-0001");
    expect(response.text).not.toContain("TESTE-0003");
    expect(response.text).not.toContain("TESTE-0004");
  });

  it("recusa ordenação na exportação com 400", async () => {
    const response = await client.get("/reports/requests.csv?sortBy=protocol");

    expect(response.status).toBe(400);
  });
});
