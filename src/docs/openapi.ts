export const openapiBase = {
  openapi: "3.0.1",
  info: {
    title: "MAAT API",
    version: "1.0.0",
    description:
      "API do MAAT" +
      "Autenticação: JWT em cookie HttpOnly (`session_id`). " +
      "Faça login via `POST /auth/login` no Swagger UI para definir o cookie, " +
      "e então teste os endpoints protegidos.",
    contact: {
      name: "NEO Kaizen",
    },
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
    { name: "Fila de atendimento", description: "Métricas, listagem e mapeamento da fila" },
    {
      name: "Configuração do portal",
      description: "Configurações globais do portal (requer Administrador)",
    },
    { name: "Priorização", description: "Critérios e pontuação de priorização" },
    { name: "Relatórios", description: "Relatórios e exportações" },
    { name: "Auditoria", description: "Histórico de auditoria e logs" },
    { name: "Notas internas", description: "Notas internas de solicitações" },
    { name: "Pendências", description: "Pendências e verificação pública" },
  ],
  security: [
    {
      cookieAuth: [],
    },
  ],
};
