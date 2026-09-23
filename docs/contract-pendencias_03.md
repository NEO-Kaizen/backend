# Contrato de API — pendências por campo

- **Status:** `draft`
- **Versão:** v0.5
- **Arquivo canônico:** `NEO-Kaizen/frontend/contratos/pendencias.md`
- **Rascunho:** `contratos/formalizacao/pendencias.md`
- **Donos:** Frontend · Backend · Produto · Banco de Dados
- **Última revisão:** 2026-09-20
- **Fonte de verdade:** `contratos/fluxo-solicitante/BACKEND-CONTRATO-PENDENCIAS-POR-CAMPO.md` (legado, §§1–5);
  `contratos/requester-pedency-tracking-contract.md` (§§2, 6–7, público); protótipo do analista
  (`PendencyCard` 3 estados + diff GitHub + `comprovante.pdf`); issues #120/#123/#125/#126;
  `contratos/audit/tratativa.md` (T1–T9); `docs/produto/pending.md` (PEND-006).

## 1. Escopo

Ciclo de pendências da tratativa: o analista envia um pedido com **observação e/ou
campos marcados**, o solicitante responde **um item por vez** (um fetch por botão
"Confirmar") e o analista revisa de forma **parcial e repetível** — validando,
reabrindo ou deixando itens para depois, até todos estarem decididos.

- O lote pode conter **só observação** (sem nenhum campo marcado), **só campos**,
  ou **misto** (observação + campos). Nos três casos o ciclo é o mesmo
  `requested → responded → validated`.
- **Não há chat livre.** O solicitante só pode responder a um pedido do analista
  (item `requested` de um lote). A separação visual do protótipo ("O que foi
  solicitado" vs "O que o solicitante respondeu") é layout dentro do mesmo card,
  não dois canais.

Cobre:

- Criação de pendências em lote (`POST /pending-items`), com `observation` opcional
  e `items` opcional (pelo menos um dos dois exigido).
- Listagem dedicada (`GET /pending-items`) — rota específica para buscar as pendências.
- Resposta por item (`PATCH /pending-items/:pendingItemId`): `{ correctedValue }`
  para campo, `{ response }` para observação.
- Upload de anexo **separado** (`POST /pending-items/:pendingItemId/attachments`),
  com `requestAttachment` como flag do **lote** (nunca por campo).
- Revisão do analista em lote parcial e repetível (`PATCH /pending-items/review` — D-P23).
- Extensão de leitura no `GET /requests/:protocol/internal` (`unread` por usuário,
  `correctionAlert`, `pendingSummary` — calculados só de `PendingItem`).
- Verificação pública de identidade com retorno **bool** (`POST /public/verify`),
  sem emissão de JWT novo (identidade guardada em `sessionStorage` com vida útil
  da página — limpa ao sair de `/acompanhar/[protocolo]`; implementação a cargo
  do frontend).

## 2. Fora de escopo

- Chat livre / thread geral (`GET/POST /requests/:protocol/messages`, `events` de
  auditoria): **não é via de resposta neste domínio**. O solicitante não envia
  mensagem avulsa; toda resposta fecha um item via `PATCH`. Se existir thread para
  triagem, pertence a outro contrato e não alimenta `status`/`unread` da pendência.
- Detalhe público/autenticado (`GET /requests/:protocol/tracking`) → contrato do
  solicitante §§3, 9.
- Triagem, status, atribuição de responsável (`PATCH /internal/assignee`,
  `GET /users?profile=analista`) → `contract-assign-action.md`.
- Listagem pública (`GET /requests`, `GET /requests/:protocol`) → `api-requests.md`.
- Mapeamento (`GET/PUT .../mapping`) → FE #127 (`audit/tratativa.md` T4).
- Observações internas timeline → `audit/tratativa.md` T6.
- Download genérico de anexos do request → `requester-pedency-tracking-contract.md` §8
  (mantido, com mesma autorização).
- Log de auditoria (`audit_history`) — apenas referenciado como registro imutável;
  formato em `audit.md`.

## 3. Autenticação e autorização

- **Internas** (criar + revisar + leitura interna completa): cookie **`session_id`**
  (JWT opaco `HttpOnly`, `SameSite=Lax`, `Secure` só em produção), perfis
  `Analista`/`Gestor`/`Administrador`. Criar/revisar exige **Administrador ou o
  responsável atribuído** (`assignee`, mesma regra do botão "Editar" / `canTriage`).
  Demais casos → `403`. Sem cookie/inválido → `401`. Perfil `Solicitante` em rota
  interna → `403`.
- **Públicas / solicitante** (listar próprias pendências, responder item, anexar):
  identidade **protocolo + nome + e-mail** (PEND-006). Fluxo:
  1. `POST /requests/:protocol/public/verify` com `{ name, email, protocol }`
     retorna **bool** `{ canAccess: true }` (sem `Set-Cookie`, sem JWT novo).
  2. O frontend guarda `{ protocol, name, email, verifiedAt }` em **`sessionStorage`**
     com **vida útil da página**: a identidade é válida somente enquanto o
     usuário permanecer em `/acompanhar/[protocolo]` e deve ser **descartada ao
     sair da página** — um novo acesso exige novo `verify`. A forma de detectar
     a saída e limpar (navegação SPA, unload, troca de protocolo) é decisão de
     implementação do frontend; o contrato exige apenas o comportamento observável.
     A cada chamada o frontend reenvia a identidade em header `X-Requester-Identity`
     (JSON `{ name, email }`) — ou repete o `verify` silencioso. O backend revalida
     (`trim`, minúsculas, sem acentos no nome; `trim` + minúsculas no e-mail;
     `protocol` idêntico ao da URL, anti-IDOR). Na prática, no fio:
     ```http
     # Interna (analista) — cookie de sessão, navegador reenvia com credentials: "include"
     Cookie: session_id=<jwt>
     # Pública (solicitante) — identidade verificada, sem cookie novo
     X-Requester-Identity: {"name":"Carlos Eduardo Silva","email":"carlos.silva@empresa.com.br"}
     ```
     `:protocol` vai sempre no path e deve ser idêntico ao verificado.
  3. Divergência/ausência/expiração (TTL de referência 30 min, controlado pelo
     `verifiedAt` do front + rate-limit do back) → `401 { "message": "Valide seus
dados para acompanhar esta solicitação." }` (genérico, sem revelar qual campo
     divergiu nem se o protocolo existe).
- Sessão interna (`session_id`) também é aceita nas rotas do solicitante: perfil
  interno entra como `analyst`; `Solicitante` dono entra como `requester`
  (mesma regra de `requester-pedency-tracking-contract.md` §1.1, menos o JWT
  `requester_access`).
- Rate-limit no `verify`: 10 tentativas / 10 min por IP + protocolo (todas as
  tentativas contam) → `429`.

## 4. Convenções transversais

Valem as convenções congeladas do template (`_template.md` §4): envelope de erro
`{ status: "error", statusCode, message }` com mensagens em pt-BR (`500` nunca vaza
detalhe); sucesso retorna o recurso direto; sem envelope paginado neste domínio
(lista curta, ordem cronológica); formato de `400`
(`Campos obrigatórios ausentes: <a, b>` e/ou `Campos inválidos: <campo> — <motivo>`);
datas ISO-8601 UTC; data pura `yyyy-mm-dd` onde indicado; IDs sempre string no JSON;
chaves/estruturas em inglês `camelCase`, valores de domínio em pt-BR; e-mail
normalizado no backend.

## 5. Enums e vocabulários

| Enum                                | Valores                                                                      | Fonte                                                                      | Dono    |
| ----------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| `PendencyStatus`                    | `requested` \| `responded` \| `validated`                                    | este contrato §6; migra `pending_items.status` (`open\|overdue\|resolved`) | Backend |
| `PendingItemType`                   | `field_edit` \| `observation`                                                | este contrato §7 (D-P11)                                                   | Produto |
| `OverdueView`                       | view derivada, não status físico: `requested AND deadline < hoje`            | `requester-pedency-tracking-contract.md` §6                                | Backend |
| `ReviewDecision`                    | `validate` \| `reopen`                                                       | este contrato §7                                                           | Produto |
| `RequestStatus` (subconjunto usado) | `Pendente de informações` \| `Em triagem` (+ demais 17 de `api-requests.md`) | `api-requests.md`                                                          | Produto |
| `AttachmentAction`                  | upload separado por item (multipart), exigência no nível do lote             | este contrato §7                                                           | Backend |

Mapa visual (protótipo): `requested` → "Pendência solicitada" (amarelo/cinza);
`responded` (lote completo) → "Resposta a aprovar" (amarelo) e "Pendência respondida"
(verde, com `Validar alteração` / `Solicitar novamente`); `validated` → "Validada"
(cinza). `overdue` é apresentação sobre `requested` com `deadline` vencido.
Item `observation` (sem `field`) renderiza como bolha de texto, sem diff GitHub;
item `field_edit` renderiza diff `currentValue → correctedValue`.

## 6. Máquina de estados

```
item: requested ──PATCH :pendingItemId──▶ responded ──review validate──▶ validated
                        │                              └─review reopen──▶ requested (sobrescreve)
lote (batchId):
  requested (≥1 item requested) ──último item → responded──▶ responded ("Resposta a aprovar")
  responded ──review com ≥1 reopen──▶ requested ("Pendente de informações")
  responded ──review tudo validate──▶ validated (status da solicitação inalterado)
solicitação:
  criação / qualquer reopen → "Pendente de informações"
  lote completo responded (sem requested remanescente + anexo satisfeito) → "Em triagem"
  validação total → inalterado
```

- Vale para `field_edit` e `observation` igualmente. O card "Resposta a aprovar" /
  CTAs `Validar alteração` aparecem só quando **todos** os itens do `batchId`
  estão `responded` (e, se `requestAttachment: true`, há ≥1 anexo nos itens do lote).
- Item é mutável: `reopen` sobrescreve `comment`, limpa `correctedValue` /
  `responseText`, `respondedAt`/`validatedAt`, `createdAt` = agora. Anexos da
  resposta são preservados salvo nova rodada exigir substituição.
- Estado atual vive no item; "Ver histórico completo" lê `audit_history`
  (anterior/novo por decisão).
- Transições impossíveis → `409`. Criação, resposta e revisão são atômicas
  (rollback integral).

## 7. Endpoints

| Método | Rota                                                           | Auth                                                                   | Resposta                                                                                         |
| ------ | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| POST   | `/requests/:protocol/pending-items`                            | cookie `session_id` (`Administrador` ou `assignee`)                    | `201 CreatePendingItemsResponse` (sem `solicitationStatus` — D-P18)                              |
| GET    | `/requests/:protocol/pending-items`                            | cookie `session_id` **ou** header `X-Requester-Identity` (pública, §3) | `200 ListPendingItemsResponse` (`batchId` + `requestAttachment` + `items`)                       |
| PATCH  | `/requests/:protocol/pending-items/:pendingItemId`             | cookie `session_id` **ou** header `X-Requester-Identity` (pública, §3) | `200 PendingItem` (`responded`)                                                                  |
| POST   | `/requests/:protocol/pending-items/:pendingItemId/attachments` | cookie `session_id` **ou** header `X-Requester-Identity` (pública, §3) | `201 InternalAttachment`                                                                         |
| PATCH  | `/requests/:protocol/pending-items/review`                     | cookie `session_id` (`Administrador` ou `assignee`)                    | `200 ReviewPendingItemsResponse` (sem `solicitationStatus` — D-P18; parcial e repetível — D-P23) |
| GET    | `/requests/:protocol/internal` (estendido)                     | cookie `session_id` (interna)                                          | `200 InternalRequestDetail + unread/correctionAlert/pendingSummary`                              |
| GET    | `/requests/:protocol/tracking`                                 | cookie `session_id` do dono **ou** header `X-Requester-Identity` (§3)  | `200 { mode: 'public' \| 'authenticated', details }`                                             |
| POST   | `/requests/:protocol/public/verify`                            | pública                                                                | `200 { canAccess: true }` (bool, sem JWT)                                                        |

Tipos comuns:

```ts
export type PendencyStatus = "requested" | "responded" | "validated";
export type PendingItemType = "field_edit" | "observation";

export interface PendingFieldRef {
  fieldKey: string; // path pontuado do catálogo (§8) — front envia só a chave
  fieldLabel: string; // derivado no servidor
  currentValue: string | number | boolean | null; // snapshot na criação
}

export interface InternalAttachment {
  fileName: string;
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máx. 10MB por arquivo
  downloadUrl: string | null;
  canDownload: boolean;
}

export interface PendingItem {
  id: string;
  protocol: string; // "MAAT-8K3P-9X2M"
  batchId: string; // agrupa itens do mesmo POST
  type: PendingItemType;
  field: PendingFieldRef | null; // null quando observation — card mostra só observação
  comment: string; // justificativa/observação do analista (sempre presente)
  status: PendencyStatus;
  correctedValue: string | number | boolean | null; // só field_edit
  responseText: string | null; // só observation — resposta discursiva (D-P14)
  responseAttachments: InternalAttachment[];
  deadline?: string | null; // yyyy-mm-dd, quando houver
  createdAt: string; // ISO-8601 UTC
  respondedAt: string | null;
  validatedAt: string | null;
}
// Sem `responseComment` por campo (decisão D-P7). Sem `email`/`batchId` no body de
// resposta: identidade vem da credencial e o lote deriva do item.

export interface UnreadState {
  count: number; // itens no conjunto pendente do lado corrente (D-P21)
  hasUnread: boolean;
  lastUnreadAt: string | null; // derivado: maior respondedAt/createdAt entre os contados
}

export interface CorrectionAlert {
  count: number; // nº de itens com resposta a aprovar
  batchId: string;
}

export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
```

### POST /requests/:protocol/pending-items — Solicitar (observação e/ou campos)

- **Auth:** cookie `session_id` (`Administrador` ou `assignee`); senão `403`.
- **Body:** `CreatePendingItemsBody` (`application/json`):
  ```ts
  export interface CreatePendingItemsBody {
    observation?: string; // 1–2000 após trim; obrigatório se items vazio/ausente
    requestAttachment?: boolean; // default false — flag do LOTE (nunca por campo)
    items?: Array<{ fieldKey: string; comment: string }>; // pode ser omitido/[]
  }
  ```
- **Regras:** pelo menos um de (`observation` com trim não-vazio) OU (`items.length ≥ 1`);
  senão `400`. `observation` presente gera **1** item `type: "observation"`,
  `field: null`, `comment = observation`. Cada `items[]` gera 1 item
  `type: "field_edit"`. Todos com o mesmo `batchId`, `status: "requested"`,
  `correctedValue: null`, `responseText: null`, `responseAttachments: []`.
  Misto (`observation` + `items`) é permitido e gera `1 + N` itens.
- **Na mesma transação**, o backend aplica `status → "Pendente de informações"`
  (regra de negócio interna — D-P18). O novo status **não** é devolvido nesta
  resposta; o frontend o observa via `GET /requests/:protocol/internal` (interno)
  ou `GET /requests/:protocol/tracking` (solicitante).
- **Response `201`:** `CreatePendingItemsResponse`:
  ```ts
  export interface CreatePendingItemsResponse {
    batchId: string;
    requestAttachment: boolean;
    items: PendingItem[]; // todos `requested`, mesmo batchId
  }
  ```
- **Erros:** `400` — `observation` e `items` ambos ausentes/vazios, `observation` >
  2000, `comment` vazio após `trim`, `fieldKey` fora do catálogo ou não marcável;
  `401` — sem sessão; `403` — sem permissão;
  `404` — protocolo inexistente; `409` — solicitação `Concluído`/`Cancelado` ou
  **pendência já em aberto** (D-P22 — existe item `requested`/`responded` para o
  protocolo; mensagem `Já existe uma pendência em aberto para este protocolo`).

### GET /requests/:protocol/pending-items — Listar pendências (rota específica)

- **Auth (como enviar — D-P19):** duas formas, ambas com `:protocol` no path
  (deve ser idêntico ao verificado, anti-IDOR):
  - Interna: `Cookie: session_id=<jwt>` (navegador reenvia com
    `credentials: "include"`); perfis `Analista`/`Gestor`/`Administrador`.
  - Pública: header `X-Requester-Identity: {"name":"...","email":"..."}`
    (valores idênticos aos aprovados no `POST .../public/verify`, guardados em
    `sessionStorage` com vida útil da página). O backend revalida nome/e-mail
    contra a solicitação a cada chamada; divergência → `401` genérico.
- Retorna todas as pendências do `protocol` (sem filtro por `is_visible_to_requester` — coluna removida neste contrato; toda pendência é para o solicitante resolver).
- **Query:** nenhuma (ordem cronológica; agrupada por `batchId` no front em um único
  card "N campos + observação").
- **Response `200`:** `ListPendingItemsResponse` — envelope de lote (D-P8/D-P15;
  `requestAttachment` nunca é por campo):
  ```ts
  export interface ListPendingItemsResponse {
    batchId: string | null; // lote vigente; null quando não há pendências
    requestAttachment: boolean; // flag do lote vigente (default false)
    items: PendingItem[]; // vazio → []
  }
  ```
  `batchId`/`requestAttachment` descrevem o **lote aberto** (`requested`/`responded`);
  se todos os lotes estão `validated`, o lote mais recente. O FE usa
  `requestAttachment` para exibir/ocultar o input de anexo do solicitante —
  sem este campo o anexo sempre aparecia mesmo quando o lote não pedia.
- **Erros:** `401` — sem autorização; `404` — solicitação não encontrada.

### PATCH /requests/:protocol/pending-items/:pendingItemId — Responder um item

Um fetch por botão "Confirmar". Idempotente por item. Única via de resposta do
solicitante (sem chat livre).

- **Auth:** cookie `session_id` **ou** header `X-Requester-Identity` (D-P19 —
  ver bloco do `GET /pending-items`). `:pendingItemId` deve pertencer
  a `:protocol`; senão `404` genérico (anti-IDOR).
- **Body** (`application/json` — sem multipart aqui; anexo é rota separada),
  discriminado pelo `type` armazenado:
  ```ts
  // field_edit:
  {
    correctedValue: string | number | boolean | null;
  } // OBRIGATÓRIO (presença, não truthiness)
  // observation:
  {
    response: string;
  } // OBRIGATÓRIO, trim 1–2000
  ```
  Enviar o campo do outro tipo → `400`.
- **Efeito:** item `requested → responded`, `respondedAt = agora`
  (`correctedValue` ou `responseText` preenchido). Na mesma transação o backend
  aplica a regra de status da solicitação (D-P18): se não restar nenhum `requested`
  no lote/solicitação **e** a exigência de anexo do lote estiver satisfeita, aplica
  `status → "Em triagem"`; senão mantém `"Pendente de informações"`. O novo status
  **não** é devolvido aqui — observa-se via `GET /internal` / `tracking`. O item
  migra para o conjunto pendente dos internos (`responded`).
- **Response `200`:** o `PendingItem` atualizado.
- **Erros:** `400` — campo obrigatório ausente, `response` vazio/longo demais,
  tipo trocado, body malformado;
  `401` — sem autorização; `404` — item/protocolo inexistente ou de outro protocolo;
  `409` — item já `responded`/`validated` ("Esta pendência já foi respondida.").

> Removido: `POST /pending-items/respond` em lote (legado
> `BACKEND-CONTRATO-PENDENCIAS-POR-CAMPO.md` §2). Sem mock a preservar; o fluxo por
> item o substitui. Não implementar a rota batch no freeze.

### POST /requests/:protocol/pending-items/:pendingItemId/attachments — Anexar (separado)

- **Auth:** cookie `session_id` **ou** header `X-Requester-Identity` (D-P19 —
  ver bloco do `GET /pending-items`).
- **Body:** `multipart/form-data` com uma parte `file` (PDF/DOCX/XLSX/PNG/JPG,
  ≤10MB). Metadados derivados no servidor.
- **Efeito:** anexa ao `responseAttachments` do item (não altera `status` sozinho;
  o `status` só muda via `PATCH`). Como `requestAttachment` é do **lote** (nunca por
  campo — D-P8/D-P15), o lote com `requestAttachment: true` só é considerado
  completo quando **todos** os itens estão `responded` **e** há ≥1 anexo em qualquer
  item do lote.
- **Response `201`:** `InternalAttachment`.
- **Erros:** `400` — tipo/tamanho inválido; `401`/`404` como acima. Nunca `400`
  por "anexo inesperado" quando o flag é `false` — apenas valida formato/tamanho.

### PATCH /requests/:protocol/pending-items/review — Revisar (analista, parcial)

Revisão parcial e repetível (D-P23): cada chamada decide **1..N** itens `responded`
do lote; itens omitidos permanecem `responded` ("revisar depois") para decidir em
chamada posterior. O lote só fecha quando não restar nenhum `responded`.

- **Auth:** cookie `session_id` (`Administrador` ou `assignee`); senão `403`.
- **Body:**
  ```ts
  export type ReviewPendingItemDecision =
    | { id: string; decision: "validate"; note?: string } // note: só audit, opcional
    | { id: string; decision: "reopen"; comment: string }; // comment trim não-vazio
  export interface ReviewPendingItemsBody {
    batchId: string;
    requestAttachment?: boolean; // (re)define flag do lote p/ próxima rodada
    items: ReviewPendingItemDecision[]; // 1..N itens `responded` do lote (subconjunto permitido)
  }
  ```
- **Efeito (transação atômica por chamada):** `validate` em `field_edit` aplica `correctedValue`
  no campo (`fieldKey`, com conversão número/boolean/data e validação de vocabulário);
  `validate` em `observation` só marca `validated` (sem aplicar campo).
  `status → validated`, `validatedAt = agora` (`note` vai só ao `audit_history`);
  `reopen` sobrescreve: `status → requested`, `comment = novo`, limpa
  `correctedValue`/`responseText`/`respondedAt`/`validatedAt`, `createdAt = agora`.
  Reenvio do mesmo `id + decision` é idempotente (sem duplicar `audit_history`).
  Após a chamada: se restar algum `responded` no lote, a pendência segue aberta e
  a criação de nova pendência continua bloqueada (D-P22); se houver ≥1 `reopen` na
  chamada, backend aplica `status = "Pendente de informações"` (D-P18); se a chamada
  zerar os `responded` com tudo `validate`, status da solicitação inalterado.
  O novo status **não** é devolvido aqui — observa-se
  via `GET /internal` / `tracking`. Toda decisão nova grava `audit_history` (anterior/novo).
- **Response `200`:**
  ```ts
  export interface ReviewPendingItemsResponse {
    batchId: string;
    items: PendingItem[]; // estado atual dos itens decididos nesta chamada
  }
  ```
- **Erros:** `400` — `items` ausente/vazio, `reopen` sem `comment`;
  `401`/`403`/`404` como acima; `409` — item decidido não está `responded`.

### GET /requests/:protocol/internal (estendido) — detalhe + unread

- **Auth:** cookie `session_id` (interna). Mesma regra de `contract-assign-action.md`.
- **Acrescentar ao `InternalRequestDetail`:**
  ```ts
  correctionAlert: CorrectionAlert | null; // antes sempre null — corrigir (T2)
  pendingSummary: PendingSummary; // badge sem carregar a lista (conta observation junto)
  unread: UnreadState; // por lado, derivado só de status, sem armazenamento (D-P21)
  ```
- **`unread` derivado de `status` (D-P21):** sem tabela de leitura, sem endpoint de
  "marcar como lido", sem efeito colateral em `GET`. O contador é a fila de trabalho
  de cada lado — ver sem agir não zera o badge; só `PATCH` e `review` movem itens:
  - internos (analista): não lidos = itens com `status = responded`
    (respondidos, mas ainda não validados);
  - lado público (solicitante, mesma regra espelhada): não lidos = itens com
    `status = requested` (criação + `reopen` — o que ele ainda não respondeu).
  - `count` = nº de itens no conjunto; `hasUnread = count > 0`;
    `lastUnreadAt` = maior `respondedAt` (internos) / `createdAt` (solicitante)
    entre os contados, ou `null` quando vazio. Itens `validated` saem dos dois
    contadores (validação concluída não é "não lida" — acompanha-se via
    `pendingSummary.validated` e status da solicitação).
  - Opcionalmente refletir `unread: boolean` no `QueueItem` (bolinha na fila) com
    a mesma derivação.
- **Erros:** `401`/`403`/`404` no envelope padrão.

### POST /requests/:protocol/public/verify — verificação bool (sem JWT)

- **Auth:** pública. Só existe com o portal em modo `PUBLIC`; em `AUTHENTICATED` → `403`.
- **Body:** `{ name: string; email: string; protocol: string }` (`protocol` idêntico
  ao da URL; `name` 3–150, comparação normalizada; `email` válido ≤254).
- **Ordem:** rate-limit → formato (`400`) → modo (`403`) → identidade (`401` genérico).
- **Response `200`:** `{ canAccess: true }` (+ `protocol` ecoado). **Sem `Set-Cookie`,
  sem JWT, sem `expiresInMinutes`.** O frontend guarda em `sessionStorage` com vida
  útil da página (limpa ao sair de `/acompanhar/[protocolo]`, sem implementação
  prescrita) e reenvia via `X-Requester-Identity`.
- **Erros:** `400` formato; `401` genérico anti-enumeração; `403` portal não público;
  `429` rate-limit.

### GET /requests/:protocol/tracking — detalhe do acompanhamento (solicitante)

- **Auth (dual, ordem):** cookie `session_id` → `authMiddleware` (dono pelo vínculo
  `requests.requester_user_id`; fallback por e-mail normalizado em solicitações
  legadas/anônimas) ⇒ `authenticated`; sem cookie + header `X-Requester-Identity`
  válido ⇒ `public`. Sem rate-limit próprio — o gate continua sendo o `verify`
  (`10/10 min por IP+protocolo`). Perfis internos usam `GET /internal`.
- **`mode:** ` public`(não autenticado) devolve o recorte público:`protocol`,
`status`(do request — sem`solicitationStatus`inventado),`openedAt`,
`lastUpdate`, `meeting`, `requester`(identificação),`demand`(detalhes) e`impacts` (`mainRisks`, `clientImpact`, `operationalImpact`,
`perceivedCriticality`, `desiredDeadline`). **Nunca** inclui `operational`detalhado,`complementary`, `schedulePreferences` nem anexos.
- **`mode: "authenticated"`** (dono logado) devolve `public` + `operational`
  completo, `complementary`, `schedulePreferences`, `mappingDate` e
  `attachments` (metadados; `downloadUrl` vazio e `canDownload: false` até
  existir endpoint de download).
- **Formato:** `200 { mode: 'public' | 'authenticated', details }` — DTO
  `RequestTracking.dto.ts`, espelho de `frontend/src/lib/types/requester-tracking.ts`.
- **Erros (ordem):** `400` protocolo ausente; `401` genérico
  (`Valide seus dados para acompanhar esta solicitação.`) — identidade
  ausente/divergente/expirada ou protocolo inexistente no modo público
  (anti-enumeração); `403` portal `AUTHENTICATED` sem sessão e perfil interno
  (este deve usar `/internal`); `404` protocolo inexistente **ou** não-dono em
  sessão (não revela a existência).
- **IDOR/anti-enumeração:** o `:protocol` da URL é a chave de busca; a
  identidade pública é comparada contra o snapshot `requesters` (nome/e-mail
  normalizados) e o dono autenticado pelo vínculo `requester_user_id`.

## 8. Regras de negócio

- **Observação e/ou campos (D-P11/D-P13):** `observation` (1–2000) e `items`
  são ambos opcionais, mas pelo menos um é exigido. Misto permitido: card mostra
  observação no topo + chips/cards de campo abaixo. Referência produto:
  RF09/RF04, PEND-006, `consulta-de-solicitacao.md` (resposta → `Em triagem`).
- **Sem chat livre (D-P12):** o solicitante não tem `POST /messages` neste domínio.
  A única escrita do solicitante é `PATCH .../:id` (+ `POST .../:id/attachments`).
  Observação geral "Segue a atualização..." do protótipo, se necessária, é o
  próprio `response` da observação — não um chat separado.
- **Resposta por item (D-P1/D-P7/D-P14):** cada `PATCH` leva `correctedValue`
  (campo) ou `response` (observação, 1–2000). Sem `responseComment` por campo, sem
  `email`/`batchId` no body — identidade da credencial, lote do item.
- **Lote só aprova completo:** o card "Resposta a aprovar" / CTAs `Validar alteração`
  aparecem só quando **todos** os itens do `batchId` estão `responded` (+ anexo
  satisfeito). O `PATCH .../review` pode decidir um subconjunto por chamada
  (D-P23 — ex.: botão "Validar (3 campos)"); itens não decididos permanecem
  `responded` para depois. Progresso `respondidos/total` e `validados/total`
  derivam do `GET /pending-items`.
- **Uma pendência por vez (D-P22):** enquanto existir item `requested` ou `responded`
  para o `protocol`, `POST /pending-items` responde `409`. O analista só cria nova
  pendência após `validated` total do lote (todos os itens `validated`).
- **Anexo no lote, nunca por campo (D-P8/D-P15):** `requestAttachment` é flag do
  lote; o upload é por item mas a completude é do lote (≥1 anexo em qualquer item
  quando `true`). Vale para lote só-observação, só-campos ou misto.
- **Unread por lado, derivado de `status` (D-P2/D-P21):** `GET /internal` retorna
  `unread` sem armazenamento e sem "marcar leitura": internos contam `responded`
  (respondido, não validado); solicitante conta `requested` (criação + `reopen`,
  ainda não respondido). `PATCH` move o item para o conjunto do analista,
  `reopen` devolve ao do solicitante, `validate` tira dos dois. Sem WebSocket no
  MVP (polling para atualizar o número).
- **Catálogo `fieldKey` (D-P4):** backend dono — deriva `fieldLabel`/`currentValue`,
  rejeita `400` fora da lista de 33 (`requester.*`, `demand.*`, `operational.*`,
  `complementary.*`, cf. legado §5). Exceção: `requester.fullName`/`corporateEmail`
  só marcáveis sem `requester_user_id` (solicitação pública); senão `400`.
  `schedulePreferences` e anexos-lista fora do v1 (issue própria). Catálogo fechado
  (derivado de `src/shared/types/requests.ts` — `RequesterBlock` 6 + `DemandBlock` 8
  - `OperationalBlock` 14 + `ComplementaryBlock` 5 = 33):

  | #   | `fieldKey`                              | `fieldLabel`                | bloco         | tipo `currentValue`                         |
  | --- | --------------------------------------- | --------------------------- | ------------- | ------------------------------------------- |
  | 1   | `requester.fullName`                    | Nome completo               | requester     | `string`                                    |
  | 2   | `requester.corporateEmail`              | E-mail corporativo          | requester     | `string`                                    |
  | 3   | `requester.area`                        | Área                        | requester     | `string`                                    |
  | 4   | `requester.department`                  | Departamento                | requester     | `string \| null`                            |
  | 5   | `requester.manager`                     | Gestor responsável          | requester     | `string`                                    |
  | 6   | `requester.additionalContact`           | Contato adicional           | requester     | `string \| null`                            |
  | 7   | `demand.title`                          | Título resumido             | demand        | `string`                                    |
  | 8   | `demand.requestType`                    | Tipo de solicitação         | demand        | `string`                                    |
  | 9   | `demand.category`                       | Categoria                   | demand        | `string`                                    |
  | 10  | `demand.processName`                    | Nome do processo            | demand        | `string`                                    |
  | 11  | `demand.description`                    | Descrição da necessidade    | demand        | `string`                                    |
  | 12  | `demand.problem`                        | Problema/oportunidade       | demand        | `string`                                    |
  | 13  | `demand.expectedResult`                 | Resultado esperado          | demand        | `string`                                    |
  | 14  | `demand.justification`                  | Justificativa               | demand        | `string`                                    |
  | 15  | `operational.processDescription`        | Descrição do processo atual | operational   | `string`                                    |
  | 16  | `operational.processSteps`              | Etapas do processo          | operational   | `string`                                    |
  | 17  | `operational.systemsUsed`               | Sistemas utilizados         | operational   | `string`                                    |
  | 18  | `operational.executionFrequency`        | Frequência de execução      | operational   | `string`                                    |
  | 19  | `operational.volumetry`                 | Volumetria                  | operational   | `string`                                    |
  | 20  | `operational.peopleInvolved`            | Pessoas envolvidas          | operational   | `number`                                    |
  | 21  | `operational.averageExecutionTime`      | Tempo médio por ciclo       | operational   | `string`                                    |
  | 22  | `operational.monthlyEffortHours`        | Esforço mensal (horas)      | operational   | `number`                                    |
  | 23  | `operational.hasManualControls`         | Controles manuais           | operational   | `false \| string` (`YesNoDetail`)           |
  | 24  | `operational.mainRisks`                 | Principais riscos           | operational   | `string`                                    |
  | 25  | `operational.clientImpact`              | Impacto no cliente          | operational   | `string`                                    |
  | 26  | `operational.operationalImpact`         | Impacto operacional         | operational   | `"Baixo" \| "Médio" \| "Alto" \| "Crítico"` |
  | 27  | `operational.desiredDeadline`           | Prazo desejado              | operational   | `string` (`yyyy-mm-dd`)                     |
  | 28  | `operational.perceivedCriticality`      | Criticidade percebida       | operational   | `"Baixa" \| "Média" \| "Alta" \| "Crítica"` |
  | 29  | `complementary.hasProcessDocumentation` | Documentação do processo    | complementary | `false \| string \| null`                   |
  | 30  | `complementary.hasSimilarSolution`      | Solução semelhante          | complementary | `false \| string \| null`                   |
  | 31  | `complementary.dependsOnOtherAreas`     | Dependência de outras áreas | complementary | `false \| string \| null`                   |
  | 32  | `complementary.handlesRestrictedInfo`   | Informação restrita (LGPD)  | complementary | `false \| string \| null`                   |
  | 33  | `complementary.additionalNotes`         | Observações adicionais      | complementary | `string \| null`                            |

- **Serialização do `correctedValue`:** `peopleInvolved`/`monthlyEffortHours` → número;
  `hasManualControls` → `false` ou string não-vazia; `desiredDeadline` → `yyyy-mm-dd`;
  `operationalImpact` (`Baixo|Médio|Alto|Crítico`), `perceivedCriticality`
  (`Baixa|Média|Alta|Crítica`) validados contra vocabulário; demais → texto.
  Conversão na revisão (`validate`); string vazia onde se espera detalhe → `400`.
- **Sessão pública bool (D-P5/D-P17):** sem JWT `requester_access`; `sessionStorage`
  `{ protocol, name, email, verifiedAt }` com vida útil da página (descartada ao
  sair de `/acompanhar/[protocolo]`; mecanismo de limpeza a cargo do frontend) +
  header `X-Requester-Identity`. Backend nunca confia no front para
  `authorKind`/`authorLabel` (deriva da credencial).
- **IDOR/anti-enumeração:** `protocol` da URL amarra tudo; item/anexo de outro
  protocolo → `404` genérico; `verify` nunca distingue campo divergente.
- **Auditoria:** criação, cada `PATCH`, cada anexo e cada decisão de `review` gravam
  `audit_history` (anterior/novo). Reabertura não preserva a troca no payload —
  recuperar do log.

## 9. Erros

| Status | Quando                                                                                                                                                                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `observation` e `items` ambos ausentes/vazios, `observation`/`response` vazio ou > 2000, `comment` vazio, `fieldKey` fora do catálogo/não marcável, `correctedValue` ausente, campo do outro tipo no `PATCH`, anexo com tipo/tamanho inválido, `reopen` sem `comment`, body malformado |
| `401`  | Sem cookie/identidade, sessão inválida/expirada, identidade pública divergente (genérico), troca de senha obrigatória onde aplicável                                                                                                                                                   |
| `403`  | Perfil sem acesso (`Solicitante` em rota interna), não-`assignee` e não-`Admin` em criar/revisar, portal em `AUTHENTICATED` no `verify`                                                                                                                                                |
| `404`  | Protocolo/item/lote inexistente, item/anexo de outro protocolo (genérico anti-IDOR)                                                                                                                                                                                                    |
| `409`  | `PATCH` em item já `responded`/`validated`; `review` em item não `responded`; criar em solicitação `Concluído`/`Cancelado`                                                                                                                                                             |
| `429`  | Rate-limit no `verify` (10/10 min por IP+protocolo)                                                                                                                                                                                                                                    |
| `500`  | Erro interno (sem detalhe vazado)                                                                                                                                                                                                                                                      |

Formato sempre `{ status: "error", statusCode, message }`, mensagens em pt-BR.

## 10. Exemplos

Criar lote só-observação:

```http
POST /requests/MAAT-8K3P-9X2M/pending-items HTTP/1.1
Cookie: session_id=<jwt>
Content-Type: application/json

{ "observation": "Favor esclarecer a justificativa — o texto está muito genérico." }
```

```json
HTTP/1.1 201 Created

{
  "batchId": "9f1c2c4e-7a0b-4f2e-9d3c-1b2a3c4d5e6f",
  "requestAttachment": false,
  "items": [
    {
      "id": "pi_01HZX9K3P9X2O",
      "protocol": "MAAT-8K3P-9X2M",
      "batchId": "9f1c2c4e-7a0b-4f2e-9d3c-1b2a3c4d5e6f",
      "type": "observation",
      "field": null,
      "comment": "Favor esclarecer a justificativa — o texto está muito genérico.",
      "status": "requested",
      "correctedValue": null,
      "responseText": null,
      "responseAttachments": [],
      "createdAt": "2026-10-08T14:32:00.000Z",
      "respondedAt": null,
      "validatedAt": null
    }
  ]
}
```

Responder observação (1 fetch por "Confirmar"):

```http
PATCH /requests/MAAT-8K3P-9X2M/pending-items/pi_01HZX9K3P9X2O HTTP/1.1
X-Requester-Identity: {"name":"Carlos Eduardo Silva","email":"carlos.silva@empresa.com.br"}
Content-Type: application/json

{ "response": "A justificativa é a retenção de pagamentos acima de R$ 50 mil com risco de paralisação." }
```

Criar lote com 2 campos + anexo no lote:

```http
POST /requests/MAAT-8K3P-9X2M/pending-items HTTP/1.1
Cookie: session_id=<jwt>
Content-Type: application/json

{
  "requestAttachment": true,
  "items": [
    { "fieldKey": "requester.corporateEmail", "comment": "Confirme o domínio do e-mail corporativo." },
    { "fieldKey": "operational.volumetry", "comment": "Informe a volumetria real." }
  ]
}
```

Responder um campo (1 fetch por "Confirmar"):

```http
PATCH /requests/MAAT-8K3P-9X2M/pending-items/pi_01HZX9K3P9X2M HTTP/1.1
X-Requester-Identity: {"name":"Carlos Eduardo Silva","email":"carlos.silva@empresa.com.br"}
Content-Type: application/json

{ "correctedValue": "carlos.silva@empresa.com.br" }
```

```json
HTTP/1.1 200 OK

{
  "id": "pi_01HZX9K3P9X2M",
  "protocol": "MAAT-8K3P-9X2M",
  "batchId": "9f1c2c4e-7a0b-4f2e-9d3c-1b2a3c4d5e6f",
  "type": "field_edit",
  "field": { "fieldKey": "requester.corporateEmail", "fieldLabel": "E-mail Corporativo", "currentValue": "carlos.silva@empresa" },
  "comment": "Confirme o domínio do e-mail corporativo.",
  "status": "responded",
  "correctedValue": "carlos.silva@empresa.com.br",
  "responseText": null,
  "responseAttachments": [],
  "createdAt": "2026-10-08T14:32:00.000Z",
  "respondedAt": "2026-10-09T09:15:00.000Z",
  "validatedAt": null
}
```

Anexo separado:

```http
POST /requests/MAAT-8K3P-9X2M/pending-items/pi_01HZX9K3P9X2N/attachments HTTP/1.1
X-Requester-Identity: {"name":"Carlos Eduardo Silva","email":"carlos.silva@empresa.com.br"}
Content-Type: multipart/form-data; boundary=----B

------B
Content-Disposition: form-data; name="file"; filename="comprovante.pdf"
Content-Type: application/pdf

<binário>
------B--
```

```json
HTTP/1.1 201 Created

{ "fileName": "comprovante.pdf", "mimeType": "application/pdf", "sizeBytes": 245000, "downloadUrl": null, "canDownload": false }
```

Revisar parcial — valida 3 de 5 (resto fica `responded` para depois):

```http
PATCH /requests/MAAT-8K3P-9X2M/pending-items/review HTTP/1.1
Cookie: session_id=<jwt>
Content-Type: application/json

{
  "batchId": "9f1c2c4e-7a0b-4f2e-9d3c-1b2a3c4d5e6f",
  "items": [
    { "id": "pi_01HZX9K3P9X2M", "decision": "validate" },
    { "id": "pi_01HZX9K3P9X2N", "decision": "reopen", "comment": "A volumetria não bate com o relatório. Reenvie." }
  ]
}
```

Verificação pública (bool, sem JWT):

```http
POST /requests/MAAT-8K3P-9X2M/public/verify HTTP/1.1
Content-Type: application/json

{ "name": "Carlos Eduardo Silva", "email": "carlos.silva@empresa.com.br", "protocol": "MAAT-8K3P-9X2M" }
```

```json
HTTP/1.1 200 OK

{ "protocol": "MAAT-8K3P-9X2M", "canAccess": true }
```

Trecho do `GET /requests/:protocol/internal` estendido:

```json
{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Pendente de informações",
  "correctionAlert": { "count": 2, "batchId": "9f1c2c4e-7a0b-4f2e-9d3c-1b2a3c4d5e6f" },
  "pendingSummary": { "total": 2, "requested": 1, "responded": 1, "validated": 0 },
  "unread": { "count": 1, "hasUnread": true, "lastUnreadAt": "2026-10-09T09:15:00.000Z" }
}
```

## 11. Migração e depreciação

- Substitui o fluxo de resposta em lote de
  `contratos/fluxo-solicitante/BACKEND-CONTRATO-PENDENCIAS-POR-CAMPO.md` §§2–3:
  `POST .../pending-items/respond` **removido** (não implementar); `RespondPendingItemsBody`
  com `responseComment` por campo **removido**; `PendingItem.responseComment` **removido**,
  substituído por `type` + `field: null` + `responseText` para observação.
- Substitui `contratos/requester-pedency-tracking-contract.md` §§2, 6–7: `POST
.../public/verify` deixa de emitir cookie JWT `requester_access`/`expiresInMinutes`
  e passa a bool `{ canAccess }` (identidade em `sessionStorage` + header
  `X-Requester-Identity`); `GET .../pending-items` migra `status: open|overdue|resolved`
  para `requested|responded|validated` (`overdue` vira view por `deadline`);
  `POST .../pending-items/:id/respond` com `{ response }` de 4 000 chars dá lugar a
  `PATCH .../:id` com `{ correctedValue }` (campo) ou `{ response }` 1–2000
  (observação); upload textual dá lugar à rota `POST .../:id/attachments`;
  thread livre `messages` **não** é via de resposta neste domínio.
- Banco: migrar `pending_items.status` para `requested|responded|validated`;
  `field_key` passa a anulável + colunas `type` e `response_text`;
  `responded` intermediário ("Resposta a aprovar") é `respondedAt NOT NULL AND
validatedAt IS NULL`; corrigir `correctionAlert` (`null` fixo em
  `requests.service.ts:148-150`); adicionar `deadline`, `batch_id` e
  `request_attachment` (nível do lote); remover coluna `is_visible_to_requester`
  (toda pendência é para o solicitante). Sem tabela de leitura: `unread` é derivado
  de `status` (D-P21), sem endpoint de marcação. Guarda "uma pendência por vez"
  (D-P22): `POST /pending-items` com lote aberto (`requested`/`responded`) → `409`.
- `review` é **`PATCH .../pending-items/review`** parcial e repetível (D-P23),
  não `POST` em lote fechado: o legado `BACK...MD:453` previa `POST` com decisão
  para **todos** os `responded`; como nada foi implementado, o verbo foi corrigido
  para `PATCH` sem custo de migração. Reenvio do mesmo `id + decision` é
  idempotente (sem duplicar `audit_history`).
- Respostas de escrita **não** devolvem `solicitationStatus` (D-P18): removido de
  `CreatePendingItemsResponse` e `ReviewPendingItemsResponse`; o backend aplica a
  transição e o frontend observa via `GET /internal` / `tracking`.
- **`GET /pending-items` envolto (B2):** a lista deixou de ser `PendingItem[]`
  e passou a `ListPendingItemsResponse { batchId, requestAttachment, items }`
  para expor a flag de lote (D-P8) ao solicitante — sem ela o input de anexo
  sempre aparecia, mesmo quando o lote não pedia anexo. `batchId: null` +
  `requestAttachment: false` quando não há pendências.
- Cópias antigas (`contratos/fluxo-solicitante/*`, `backend/docs/*`,
  `funcionalidades-especificacao.md`) viram ponteiros após o freeze, conforme
  `contratos/formalizacao/README.md` §"Migração das cópias antigas".

## 12. Decisões

### Fechadas

| ID    | Decisão                                                                                                                                                                                                    | Origem                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| D-P1  | Resposta por item via `PATCH .../:pendingItemId` (1 fetch por "Confirmar"); batch `POST .../respond` removido                                                                                              | follow-up d1 (sem mock a preservar)                           |
| D-P7  | Sem `responseComment` por campo; resposta vive no item (`correctedValue`/`responseText`)                                                                                                                   | follow-up d1 ("too much info if by field")                    |
| D-P8  | Anexo em rota separada `POST .../:id/attachments` (multipart); `correctedValue` escalar puro                                                                                                               | follow-up (attachment is a separate thing)                    |
| D-P2  | `unread` por usuário embutido no `GET /internal` + rota específica `GET /pending-items` para a lista                                                                                                       | follow-up d2                                                  |
| D-P5  | Verificação pública bool (`{ canAccess }`), sem JWT novo; identidade em `sessionStorage` + `X-Requester-Identity`                                                                                          | follow-up d5                                                  |
| D-P17 | Identidade pública com vida útil da página (limpa ao sair de `/acompanhar/[protocolo]`); implementação da limpeza a cargo do frontend                                                                      | follow-up sessionStorage                                      |
| D-P4  | Backend dono do catálogo de 33 `fieldKey`; exceção `fullName`/`corporateEmail` sem `requester_user_id`                                                                                                     | legado §5                                                     |
| D-P6  | `overdue` como view (`deadline` vencido), não status físico                                                                                                                                                | follow-up d6                                                  |
| D-P11 | Lote pode ter só observação (sem campos): `observation` gera 1 item `type: "observation"`, `field: null`                                                                                                   | escopo — analista pode mandar sem marcar campos               |
| D-P12 | Sem chat livre: solicitante só responde item `requested` via `PATCH`; `messages` fora deste domínio                                                                                                        | layout separado é card, não canal                             |
| D-P13 | Misto permitido (`observation` + `items` no mesmo `batchId`)                                                                                                                                               | sem motivo para proibir                                       |
| D-P14 | Resposta da observação em `responseText` no item (`PATCH { response }` 1–2000), não em `messages`                                                                                                          | ciclo/unread/review homogêneos                                |
| D-P15 | `requestAttachment` no lote (nunca por campo); lote só completa com todos `responded` + ≥1 anexo quando `true`                                                                                             | anexo é do lote                                               |
| D-P16 | Teto 2000 chars para `observation` e `response`                                                                                                                                                            | confirmado                                                    |
| D-P18 | `solicitationStatus` fora dos payloads de escrita; backend aplica a transição, front observa via `GET /internal` / `tracking`                                                                              | revisão — regra de negócio não se posta                       |
| D-P19 | Transporte da identidade explícito: cookie `session_id` (interna) ou header `X-Requester-Identity {name,email}` + `:protocol` no path (pública)                                                            | revisão — "how would we send this?"                           |
| D-P20 | ~~`unread` via `pendency_views` + `POST .../read`~~ — superseded por D-P21                                                                                                                                 | revisão                                                       |
| D-P21 | `unread` puramente derivado de `status` (internos: `responded`; solicitante: `requested`), sem armazenamento e sem endpoint de leitura                                                                     | revisão — "can be derived from responded"                     |
| D-P22 | Uma pendência por vez: `POST /pending-items` → `409` enquanto existir item `requested`/`responded` para o protocolo; nova criação só após `validated` total                                                | fluxo — pendência só resolve com todos decididos              |
| D-P23 | `review` parcial e repetível via **`PATCH .../pending-items/review`**: `items[]` com subconjunto de `responded` (omitidos ficam para depois); "deixar pendente" = ausência de decisão; reenvio idempotente | fluxo — Validar / Solicitar ajuste / Revisar depois por campo |

### Abertas (com recomendação e dono)

| ID    | Questão                                                            | Opções                                                                | Recomendação                                      | Dono             |
| ----- | ------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------- | ---------------- |
| D-P9  | `note` em `validate` permanece?                                    | (a) manter opcional só-audit; (b) remover junto com `responseComment` | (a) manter opcional, nunca exibido ao solicitante | Produto          |
| D-P10 | `pendingSummary`/`unread` também no `QueueItem` (bolinha na fila)? | (a) sim, `unread: boolean`; (b) só no detalhe                         | (a) adicionar `unread` escalar na fila            | Frontend/Backend |

> Status `draft` enquanto D-P9 e D-P10 estiverem abertas.
