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
 * Instantes nas bordas do dia UTC: 23:00Z de 31/10, 00:00Z e 23:59Z de 01/11
 * e 00:00Z de 02/11. `createdFrom`/`createdTo` são inclusivos em UTC, sem
 * depender do dia comercial `America/Sao_Paulo` do dashboard.
 */
const REQUESTS = [
  {
    protocol: "TESTE-0001",
    createdAt: "2026-10-31T23:00:00Z",
    department: "Desenvolvimento",
    label: "Alfa",
  },
  {
    protocol: "TESTE-0002",
    createdAt: "2026-11-01T00:00:00Z",
    department: "desenvolvimento",
    label: "Beta",
  },
  {
    protocol: "TESTE-0003",
    createdAt: "2026-11-01T23:59:00Z",
    department: "Financeiro",
    label: "Gamma",
  },
  {
    protocol: "TESTE-0004",
    createdAt: "2026-11-02T00:00:00Z",
    department: "Desenvolvimento",
    label: "Delta",
  },
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
      title: `Titulo ${item.label}`,
      request_type: "Automação",
      process_name: `Processo ${item.label}`,
      need_description: `Necessidade ${item.label}`,
      problem_opportunity: `Problema ${item.label}`,
      expected_result: `Resultado ${item.label}`,
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
  page: number;
  total: number;
  totalPages: number;
  departments: string[];
}

async function getQueue(requestClient: TestClient, query: string): Promise<QueueResponse> {
  const response = await requestClient.get<QueueResponse>(`/queue?${query}`);
  expect(response.status).toBe(200);
  return response.body;
}

async function listQueue(query: string): Promise<QueueResponse> {
  return await getQueue(client, `page=1&pageSize=10&${query}`);
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
  it("createdFrom usa o começo do dia UTC", async () => {
    const queue = await listQueue("createdFrom=2026-11-01");

    expect(queue.total).toBe(3);
    expect(protocols(queue)).toEqual(["TESTE-0002", "TESTE-0003", "TESTE-0004"]);
  });

  it("createdTo isolado inclui o último minuto do dia UTC", async () => {
    const queue = await listQueue("createdTo=2026-10-31");

    expect(queue.total).toBe(1);
    expect(protocols(queue)).toEqual(["TESTE-0001"]);
  });

  it("createdTo exclui o primeiro minuto do dia seguinte", async () => {
    const queue = await listQueue("createdTo=2026-11-01");

    expect(queue.total).toBe(3);
    expect(protocols(queue)).toEqual(["TESTE-0001", "TESTE-0002", "TESTE-0003"]);
  });

  it("intervalo de um dia inclui as duas pontas em UTC", async () => {
    const queue = await listQueue("createdFrom=2026-11-01&createdTo=2026-11-01");

    expect(queue.total).toBe(2);
    expect(protocols(queue)).toEqual(["TESTE-0002", "TESTE-0003"]);
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
      "createdFrom=2026-11-01&createdTo=2026-11-01&department=desenvolvimento",
    );

    expect(queue.total).toBe(1);
    expect(protocols(queue)).toEqual(["TESTE-0002"]);
  });

  it("recusa data inválida com 400", async () => {
    const response = await client.get("/queue?page=1&pageSize=10&createdFrom=2026-11-31");

    expect(response.status).toBe(400);
  });

  it("recusa intervalo invertido nas duas rotas com 400", async () => {
    const queue = await client.get(
      "/queue?page=1&pageSize=10&createdFrom=2026-11-02&createdTo=2026-11-01",
    );
    expect(queue.status).toBe(400);

    const csv = await client.get(
      "/reports/requests.csv?createdFrom=2026-11-02&createdTo=2026-11-01",
    );
    expect(csv.status).toBe(400);
  });

  it("departments é global, distinto e ordenado, independente dos filtros", async () => {
    const queue = await listQueue("department=Financeiro");

    expect(protocols(queue)).toEqual(["TESTE-0003"]);
    expect(queue.departments).toEqual(["Desenvolvimento", "Financeiro"]);
  });
});

describe("HTTP real — busca textual do contrato RF04", () => {
  it("busca por título, processo, descrição, problema e resultado esperado", async () => {
    const cases = [
      ["Titulo Alfa", "TESTE-0001"],
      ["Processo Beta", "TESTE-0002"],
      ["Necessidade Gamma", "TESTE-0003"],
      ["Problema Delta", "TESTE-0004"],
      ["Resultado Alfa", "TESTE-0001"],
    ] as const;

    for (const [term, expected] of cases) {
      const queue = await listQueue(`search=${encodeURIComponent(term)}`);
      expect(queueProtocols(queue), term).toEqual([expected]);
    }
  });

  it("busca por título e resultado esperado sem ampliar a custódia de notas", async () => {
    const analyst = await insertUser({ email: "analista@neo.com", fullName: "Analista de Teste" });
    const [professional] = (await testDb("details_professional")
      .insert({ user_id: analyst.user_id, job_title: "Analista" })
      .returning("professional_id")) as Array<{ professional_id: string }>;

    if (!professional) throw new Error("Falha ao inserir profissional de teste.");

    // 0001 está sob responsabilidade do Analista; 0002 apenas sob mapeamento.
    await testDb("requests")
      .where({ protocol: "TESTE-0001" })
      .update({ professional_id: professional.professional_id });
    await testDb("requests")
      .where({ protocol: "TESTE-0002" })
      .update({ mapping_professional_id: professional.professional_id });

    await testDb("request_internal_notes").insert([
      {
        request_id: 9001,
        author_user_id: analyst.user_id,
        author_role_at_creation: "Analista",
        content: "NotaAlfaReservada",
      },
      {
        request_id: 9002,
        author_user_id: analyst.user_id,
        author_role_at_creation: "Analista",
        content: "NotaBetaReservada",
      },
    ]);

    const analystClient = new TestClient(server.baseUrl);
    const login = await analystClient.post("/auth/login", {
      email: "analista@neo.com",
      password: DEFAULT_TEST_PASSWORD,
    });
    expect(login.status).toBe(200);

    const search = async (term: string): Promise<string[]> => {
      const queue = await getQueue(
        analystClient,
        `page=1&pageSize=10&search=${encodeURIComponent(term)}`,
      );
      return queueProtocols(queue);
    };

    expect(await search("Titulo Alfa")).toEqual(["TESTE-0001"]);
    expect(await search("Resultado Beta")).toEqual(["TESTE-0002"]);
    expect(await search("NotaAlfaReservada")).toEqual(["TESTE-0001"]);
    expect(await search("NotaBetaReservada")).toEqual([]);
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

    const byPriorityAsc = await listQueue("sortBy=priority&sortOrder=asc");
    expect(queueProtocols(byPriorityAsc)).toEqual([
      "TESTE-0003",
      "TESTE-0001",
      "TESTE-0002",
      "TESTE-0004",
    ]);
  });

  it("ordena antes de paginar", async () => {
    const firstPage = await getQueue(client, "page=1&pageSize=2&sortBy=protocol&sortOrder=desc");
    expect(firstPage.page).toBe(1);
    expect(firstPage.totalPages).toBe(2);
    expect(queueProtocols(firstPage)).toEqual(["TESTE-0004", "TESTE-0003"]);

    const secondPage = await getQueue(client, "page=2&pageSize=2&sortBy=protocol&sortOrder=desc");
    expect(secondPage.page).toBe(2);
    expect(queueProtocols(secondPage)).toEqual(["TESTE-0002", "TESTE-0001"]);
  });

  it("compara protocolo sem diferenciar maiúsculas", async () => {
    await testDb("requests").where({ protocol: "TESTE-0002" }).update({ protocol: "teste-0002" });

    expect(queueProtocols(await listQueue("sortBy=protocol&sortOrder=asc"))).toEqual([
      "TESTE-0001",
      "teste-0002",
      "TESTE-0003",
      "TESTE-0004",
    ]);
    expect(queueProtocols(await listQueue("sortBy=protocol&sortOrder=desc"))).toEqual([
      "TESTE-0004",
      "TESTE-0003",
      "teste-0002",
      "TESTE-0001",
    ]);
  });
});

describe("HTTP real — exportação CSV com os filtros compartilhados", () => {
  it("exporta apenas as solicitações do recorte", async () => {
    const response = await client.get(
      "/reports/requests.csv?createdFrom=2026-11-01&createdTo=2026-11-01&department=desenvolvimento",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.text).toContain("TESTE-0002");
    expect(response.text).not.toContain("TESTE-0001");
    expect(response.text).not.toContain("TESTE-0003");
    expect(response.text).not.toContain("TESTE-0004");
  });

  it("aplica a ordenação recebida na exportação", async () => {
    const response = await client.get("/reports/requests.csv?sortBy=protocol&sortOrder=desc");

    expect(response.status).toBe(200);
    expect(response.text.match(/TESTE-\d{4}/g)).toEqual([
      "TESTE-0004",
      "TESTE-0003",
      "TESTE-0002",
      "TESTE-0001",
    ]);
  });

  it("recusa ordenação fora do contrato na exportação com 400", async () => {
    const response = await client.get("/reports/requests.csv?sortBy=requesterName");

    expect(response.status).toBe(400);
  });
});
