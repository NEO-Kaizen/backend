import { error, json } from "../components/responses.ts";

export default {
  "/reports/dashboard": {
    get: {
      tags: ["Relatórios"],
      summary: "Relatório do dashboard",
      description:
        "Agregados das solicitações para o dashboard gerencial. Gestor e Administrador. " +
        "`open` = status não terminal; `closed` = terminal; `overdue` = aberta com prazo desejado vencido; `unassigned` = aberta sem responsável de triagem.",
      operationId: "getDashboard",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          description: "Data inicial de abertura (`yyyy-mm-dd`).",
          schema: { type: "string", format: "date" },
        },
        {
          name: "to",
          in: "query",
          required: false,
          description: "Data final de abertura (`yyyy-mm-dd`), inclusiva.",
          schema: { type: "string", format: "date" },
        },
        {
          name: "situation",
          in: "query",
          required: false,
          schema: { $ref: "#/components/schemas/DashboardSituation" },
        },
        {
          name: "statusId",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "categoryId",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "priorityId",
          in: "query",
          required: false,
          description: "ID da prioridade ou `unassigned`.",
          schema: {
            oneOf: [
              { type: "integer", minimum: 1 },
              { type: "string", enum: ["unassigned"] },
            ],
          },
        },
      ],
      responses: {
        "200": { description: "Dados do dashboard.", ...json("DashboardResponse") },
        "400": error("Filtro inválido ou intervalo invertido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (Gestor ou Administrador)."),
      },
    },
  },

  "/reports/requests.csv": {
    get: {
      tags: ["Relatórios"],
      summary: "Exportar solicitações em CSV",
      description:
        "Exporta todas as solicitações correspondentes aos filtros (sem paginação). Gestor e Administrador.\n\n" +
        "**Formato:** `text/csv; charset=utf-8`, UTF-8 com BOM, separador `;`, CRLF, campos entre aspas quando necessário. " +
        "Valores iniciados por `=`, `+`, `-` ou `@` são prefixados com `'` para neutralizar fórmulas de planilha. " +
        "Arquivo `solicitacoes-AAAA-MM-DD.csv` com `Content-Disposition: attachment`, `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.\n\n" +
        "**Colunas:** Protocolo; Data de Abertura; Área; Processo; Categoria; Status; Prioridade; Responsável; " +
        "Data de Mapeamento; Data da Última Atualização; Resultado da Triagem; Data de Conclusão. " +
        "Datas no fuso `America/Sao_Paulo`.\n\n" +
        "`status` é o nome exato do Status; `priority=nenhum` filtra prioridade nula; `assigneeId` aceita UUID, `user_id` numérico ou `unassigned`; " +
        "`unassigned=true` não pode ser combinado com `assigneeId` diferente de `unassigned`.",
      operationId: "exportRequestsCsv",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          description: "Busca por protocolo, e-mail corporativo ou nome do solicitante.",
          schema: { type: "string", maxLength: 254 },
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: { type: "string", maxLength: 100 },
        },
        {
          name: "priority",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica", "nenhum"] },
        },
        {
          name: "assigneeId",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "unassigned",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["true", "1", "false", "0"] },
        },
      ],
      responses: {
        "200": {
          description: "Arquivo CSV.",
          headers: {
            "Content-Disposition": {
              schema: { type: "string" },
              description: '`attachment; filename="solicitacoes-AAAA-MM-DD.csv"`.',
            },
            "Cache-Control": {
              schema: { type: "string", enum: ["no-store"] },
            },
            "X-Content-Type-Options": {
              schema: { type: "string", enum: ["nosniff"] },
            },
          },
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        "400": error("Filtros inválidos."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (Gestor ou Administrador)."),
      },
    },
  },
  "/reports/request/internal/{protocol}/pdf": {
    get: {
      tags: ["Relatórios"],
      summary: "Exportar solicitação em PDF (interno)",
      description:
        "Exporta os dados completos de uma solicitação em PDF. Exige autenticação e perfil Gestor ou Administrador. O PDF inclui identificação, solicitante, demanda, operação, complementar, responsáveis, anexos e observações internas. A triagem não é incluída.",
      operationId: "getReportPdf",
      parameters: [{ name: "protocol", in: "path", required: true, schema: { type: "string" } }],
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "PDF gerado com os dados da solicitação.",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        "400": {
          description: "Protocolo inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Token não fornecido ou expirado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Acesso restrito ao perfil Gestor ou Administrador.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação não encontrada.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/pdf": {
    get: {
      tags: ["Relatórios"],
      summary: "Exportar solicitação em PDF (solicitante)",
      description:
        "Exporta os dados da solicitação em PDF para o solicitante. Dois fluxos estão disponíveis: (1) com cookie de sessão do solicitante dono, que retorna o PDF no modo `authenticated` com dados completos; (2) com header `X-Requester-Identity`, que retorna o PDF no modo `public` com apenas os dados que o solicitante já vê na tela (identificação, solicitante, demanda e impactos). A triagem nunca é incluída.",
      operationId: "getRequesterRequestPdf",
      security: [{ cookieAuth: [], headerAuth: [] }],
      responses: {
        "200": {
          description: "PDF gerado com os dados da solicitação.",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        "400": {
          description: "Protocolo é obrigatório.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Valide seus dados para acompanhar esta solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfis internos devem acompanhar pela consulta interna.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};
