import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

const dualAuth = [{ cookieAuth: [] }, { requesterIdentity: [] }];

const pendingItemParam = {
  name: "pendingItemId",
  in: "path",
  required: true,
  schema: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
};

export default {
  "/requests/{protocol}/pending-items": {
    get: {
      tags: ["Pendências"],
      summary: "Listar pendências",
      description:
        "Envelope do lote vigente (`batchId`, flag `requestAttachment` e `items`). Dual-auth: com sessão, a porta interna exige `pending_item:read` sob Custódia e a porta do Solicitante aceita `pending_item:respond` em `own`; sem sessão, valida protocolo + nome + e-mail.",
      operationId: "listPendingItems",
      security: dualAuth,
      parameters: [protocolParam],
      responses: {
        "200": { description: "Lote vigente.", ...json("ListPendingItemsResponse") },
        "400": error("Protocolo inválido."),
        "401": error("Não autenticado ou identidade inválida."),
        "403": error("Sessão sem `pending_item:read` nem `pending_item:respond` em `own`."),
        "404": error("Solicitação não encontrada ou fora da Custódia/Posse do ator."),
      },
    },
    post: {
      tags: ["Pendências"],
      summary: "Criar pendências",
      description:
        "Cria um lote com observação e/ou campos marcados. Exige `pending_item:write` sob Custódia do Responsável corrente. " +
        "Na mesma transação, a solicitação passa para `Pendente de informações` (o novo status não é devolvido).",
      operationId: "createPendingItems",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePendingItemsBody" },
          },
        },
      },
      responses: {
        "201": { description: "Lote criado.", ...json("CreatePendingItemsResponse") },
        "400": error("Parâmetros inválidos (protocolo, body, fieldKey fora do catálogo)."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `pending_item:write`."),
        "404": error("Solicitação não encontrada ou fora da Custódia do ator."),
        "409": error("Solicitação concluída/cancelada ou lote já em aberto."),
      },
    },
  },

  "/requests/{protocol}/pending-items/review": {
    patch: {
      tags: ["Pendências"],
      summary: "Revisar pendências",
      description:
        "Valida ou reabre itens de um lote, de forma parcial e repetível. Exige `pending_item:review` sob Custódia do Responsável corrente.",
      operationId: "reviewPendingItems",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReviewPendingItemsBody" },
          },
        },
      },
      responses: {
        "200": { description: "Itens revisados.", ...json("ReviewPendingItemsResponse") },
        "400": error("Parâmetros inválidos."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `pending_item:review`."),
        "404": error("Solicitação/lote não encontrado ou fora da Custódia do ator."),
        "409": error("Item não está no estado permitido."),
      },
    },
  },

  "/requests/{protocol}/pending-items/{pendingItemId}": {
    patch: {
      tags: ["Pendências"],
      summary: "Responder pendência",
      description:
        "Responde um item por vez. `field_edit` recebe `correctedValue`; `observation` recebe `response`. Com sessão, exige `pending_item:respond` em `own` e Posse sobre a solicitação; sem sessão, usa a identidade pública validada.",
      operationId: "respondPendingItem",
      security: dualAuth,
      parameters: [protocolParam, pendingItemParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RespondPendingItemBody" },
          },
        },
      },
      responses: {
        "200": { description: "Item respondido.", ...json("PendingItem") },
        "400": error("Parâmetros inválidos."),
        "401": error("Não autenticado ou identidade inválida."),
        "403": error("Sessão sem `pending_item:respond` em `own`."),
        "404": error("Solicitação/pendência não encontrada ou fora da Posse do ator."),
        "409": error("Pendência já respondida ou em estado não permitido."),
      },
    },
  },

  "/requests/{protocol}/pending-items/{pendingItemId}/attachments": {
    post: {
      tags: ["Pendências"],
      summary: "Anexar arquivo à pendência",
      description:
        "Upload separado por item. PDF, DOCX, XLSX, PNG ou JPG, até 10 MB. Com sessão, exige `pending_item:respond` em `own` e Posse sobre a solicitação; sem sessão, usa a identidade pública validada.",
      operationId: "attachPendingItem",
      security: dualAuth,
      parameters: [protocolParam, pendingItemParam],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Anexo adicionado.", ...json("PendingAttachment") },
        "400": error("Arquivo acima de 10 MB ou formato não permitido."),
        "401": error("Não autenticado ou identidade inválida."),
        "403": error("Sessão sem `pending_item:respond` em `own`."),
        "404": error("Solicitação/pendência não encontrada ou fora da Posse do ator."),
      },
    },
  },

  "/requests/{protocol}/public/verify": {
    post: {
      tags: ["Pendências"],
      summary: "Verificação pública de identidade",
      description:
        "Verifica protocolo + nome + e-mail sem emitir JWT/cookie. Sujeito a rate-limit (10 tentativas / 10 min por IP + protocolo). " +
        "A resposta é genérica: não revela qual campo divergiu nem se o protocolo existe.",
      operationId: "publicVerify",
      security: [],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PublicVerifyBody" },
          },
        },
      },
      responses: {
        "200": { description: "Identidade verificada.", ...json("PublicVerifyResponse") },
        "400": error("Parâmetros inválidos."),
        "401": error("Identidade inválida ou protocolo não encontrado."),
        "403": error("Verificação indisponível no modo de acesso atual."),
        "429": error("Muitas tentativas (rate-limit)."),
      },
    },
  },
};
