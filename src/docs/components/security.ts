export const securitySchemes = {
  cookieAuth: {
    type: "apiKey",
    in: "cookie",
    name: "session_id",
    description:
      "Cookie de sessão HttpOnly definido pelo servidor após login em `POST /auth/login`. " +
      "O navegador o envia automaticamente nas requisições. Não insira valor manualmente.",
  },
  requesterIdentity: {
    type: "apiKey",
    in: "header",
    name: "X-Requester-Identity",
    description:
      'Identidade do solicitante verificada em `POST /requests/{protocol}/public/verify`: JSON `{"name":"...","email":"..."}`. ' +
      "Sem cookie e sem JWT novo; o backend revalida nome/e-mail/protocolo a cada chamada.",
  },
};
