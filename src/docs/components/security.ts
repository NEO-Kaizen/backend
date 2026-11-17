export const securitySchemes = {
  cookieAuth: {
    type: "apiKey",
    in: "cookie",
    name: "session_id",
    description:
      "Cookie de sessão HttpOnly definido pelo servidor após login em `POST /auth/login`. " +
      "O navegador o envia automaticamente nas requisições. Não insira valor manualmente.",
  },
};
