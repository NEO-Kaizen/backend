import { QUEUE_SORT_BY, QUEUE_SORT_ORDER } from "../../shared/types/queue.types.ts";

export const protocolParam = {
  name: "protocol",
  in: "path",
  required: true,
  description: "Protocolo de rastreio (ex.: MAAT-8K3P-9X2M).",
  schema: { type: "string", example: "MAAT-8K3P-9X2M" },
};

export const searchParam = {
  name: "search",
  in: "query",
  required: false,
  description:
    "Busca parcial, case-insensitive, por protocolo, título da demanda, nome do processo, " +
    "descrição, problema, resultado esperado, observações internas, nome e e-mail do solicitante. " +
    "Em `GET /queue`, a correspondência em notas exige a custódia de `internal_note:read`: o " +
    "responsável de mapeamento amplia a fila, mas não a busca por nota. Nas rotas restritas a " +
    "Gestor/Administrador não há recorte por responsável.",
  schema: { type: "string", maxLength: 254 },
};

export const createdFromParam = {
  name: "createdFrom",
  in: "query",
  required: false,
  description:
    "Data inicial de abertura (`AAAA-MM-DD`), inclusiva, comparada com `created_at` em UTC. " +
    "Não pode ser posterior a `createdTo`.",
  schema: { type: "string", format: "date", example: "2026-11-01" },
};

export const createdToParam = {
  name: "createdTo",
  in: "query",
  required: false,
  description:
    "Data final de abertura (`AAAA-MM-DD`), inclusiva, comparada com `created_at` em UTC.",
  schema: { type: "string", format: "date", example: "2026-11-30" },
};

export const departmentParam = {
  name: "department",
  in: "query",
  required: false,
  description:
    "Departamento do solicitante (com trim). Comparação exata e case-insensitive; solicitações sem departamento não correspondem.",
  schema: { type: "string", maxLength: 200, example: "Desenvolvimento" },
};

export const sortByParam = {
  name: "sortBy",
  in: "query",
  required: false,
  description:
    "Campo de ordenação, aplicável a `GET /queue` e a `GET /reports/requests.csv`. " +
    "`status` segue `statuses.order_number` e `priority` a gravidade (Crítica antes de Baixa em `desc`), " +
    "com solicitações sem prioridade sempre no fim. `protocol` é comparado sem diferenciar maiúsculas. " +
    "O desempate é feito por `protocol` ascendente, exceto quando `protocol` é o próprio campo ordenado. " +
    "Valores: `createdAt`, `protocol`, `status` ou `priority`.",
  schema: { type: "string", enum: [...QUEUE_SORT_BY], default: "createdAt" },
};

export const sortOrderParam = {
  name: "sortOrder",
  in: "query",
  required: false,
  description: "Direção da ordenação.",
  schema: { type: "string", enum: [...QUEUE_SORT_ORDER], default: "desc" },
};
