import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

export default {
  "/requests/{protocol}/internal-notes": {
    get: {
      tags: ["Notas internas"],
      summary: "Listar a Linha do tempo de notas internas",
      description:
        "Página da Linha do tempo unificada (notas internas + eventos de auditoria selecionados + registros completos de triagem/mapeamento). " +
        "Ordem mais recente primeiro, cursor keyset opaco. `unseenCount` conta somente notas de outros autores. " +
        "Exige `internal_note:read` sob Custódia do Responsável corrente; `all` dispensa o filtro de linha.",
      operationId: "listInternalNotes",
      security: [{ cookieAuth: [] }],
      parameters: [
        protocolParam,
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
        {
          name: "cursor",
          in: "query",
          required: false,
          description: "Cursor opaco devolvido em `nextCursor`.",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": { description: "Página da Linha do tempo.", ...json("InternalNotesResponse") },
        "400": error("Protocolo, `limit` ou cursor inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem a chave da rota."),
        "404": error("Solicitação inexistente ou fora da Custódia do ator."),
      },
    },
    post: {
      tags: ["Notas internas"],
      summary: "Publicar nota interna",
      description:
        "Cria uma nota interna imutável na Linha do tempo. Exige `internal_note:write` sob Custódia do Responsável corrente; a autoria vem da sessão.",
      operationId: "createInternalNote",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateInternalNoteRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Nota criada.", ...json("TimelineNote") },
        "400": error("Conteúdo vazio ou acima de 4000 caracteres."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem a chave da rota."),
        "404": error("Solicitação inexistente ou fora da Custódia do ator."),
      },
    },
  },

  "/requests/{protocol}/internal-notes/read": {
    put: {
      tags: ["Notas internas"],
      summary: "Marcar notas internas como vistas",
      description:
        "Grava o checkpoint de leitura do usuário autenticado. A nota precisa pertencer à solicitação. Exige `internal_note:read` sob Custódia.",
      operationId: "markInternalNotesRead",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MarkInternalNotesReadRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Checkpoint atualizado (sem corpo)." },
        "400": error("Payload inválido ou nota de outra solicitação."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem a chave da rota."),
        "404": error("Solicitação inexistente ou fora da Custódia do ator."),
      },
    },
  },
};
