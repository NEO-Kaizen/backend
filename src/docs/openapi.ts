export const openapiBase = {
  openapi: "3.0.1",
  info: {
    title: "MAAT API",
    version: "1.0.0",
    description:
      "API do MAAT. Autenticação: JWT em cookie HttpOnly (`session_id`). " +
      "Faça login via `POST /auth/login` no Swagger UI para definir o cookie, " +
      "e então teste os endpoints protegidos.\n\n" +
      'Convenções: erros usam `{ status: "error", statusCode, message }`, com `code` e `fields` opcionais. ' +
      "Listagens usam `{ data, page, pageSize, total, totalPages }` ou `{ items, nextCursor }`. " +
      "Datas são ISO-8601 UTC (`yyyy-mm-dd` para datas puras); ids de catálogo (`statusId`, `categoryId`, `priorityId`) são inteiros, " +
      "enquanto ids de usuário/profissional são strings.",
    contact: {
      name: "NEO Kaizen",
    },
    license: {
      name: "ISC",
      url: "https://opensource.org/license/isc-license-txt",
    },
  },
  externalDocs: {
    description: "Regras de negócio, ADRs e mapa de documentos substituídos",
    url: "https://github.com/NEO-Kaizen/backend/tree/main/docs/rules",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de desenvolvimento local",
    },
  ],
  tags: [
    { name: "Autenticação", description: "Login, logout, sessão e troca de senha" },
    { name: "Solicitações", description: "Cadastro, consulta e atualização de solicitações" },
    { name: "Triagem", description: "Avaliação de triagem de solicitações" },
    { name: "Usuários", description: "Cadastro, listagem e métricas de usuários" },
    {
      name: "Perfis",
      description: "Perfis base e customizados: catálogo de chaves, composição e ciclo de vida",
    },
    { name: "Fila de atendimento", description: "Métricas, listagem e mapeamento da fila" },
    {
      name: "Configuração do portal",
      description: "Configurações globais do portal (requer Administrador)",
    },
    { name: "Priorização", description: "Critérios e pontuação de priorização" },
    { name: "Relatórios", description: "Relatórios e exportações" },
    { name: "Auditoria", description: "Trilha de auditoria" },
    { name: "Notas internas", description: "Notas internas de solicitações" },
    { name: "Pendências", description: "Pendências e verificação pública" },
    { name: "Notificações", description: "Notificações in-app e entrega SSE" },
  ],
  security: [
    {
      cookieAuth: [],
    },
  ],
};
