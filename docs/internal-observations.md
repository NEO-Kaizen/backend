# Contrato de API — observações internas (timeline unificada)

- **Status:** `draft`
- **Versão:** v2.0
- **Arquivo canônico:** `NEO-Kaizen/frontend/contratos/observacoes-internas.md`
- **Rascunho:** `contratos/formalizacao/observacoes-internas.md`
- **Donos:** Frontend · Backend · Produto · Banco de Dados
- **Última revisão:** 2026-09-22
- **Fonte de verdade:** `backend/src/shared/audit/{auditCatalog,auditLogger}.ts`;
  `backend/src/modules/requests/triage/triage.schema.ts` (`TriageAssessment`);
  `backend/src/modules/DTOs/queue/mapping.dto.ts` (`MappingResponseDTO`);
  decisões **D-N1–D-N5, D-N7–D-N14** (2026-09-22; v2.0 sem legado — sem prod,
  quebra limpa — ver §12).

## 1. Escopo

A aba **Observações Internas** da fila interna (`/fila/[protocolo]`) exibe uma
**timeline única** de contexto privado da solicitação: **notas escritas**
(anotações livres multi-autor), **eventos leves de atribuição, status e
designação de mapeamento** da auditoria imutável, e os **registros finais
completos** de triagem e mapeamento — o observador interno vê, em ordem
cronológica, o que foi escrito e o que mudou, e lê o estado final sem abrir
outras abas nem interpretar JSON bruto.

Cobre:

- **Notas escritas** (domínio já entregue, absorvido deste contrato):
  - listagem (`GET /requests/:protocol/internal-notes`);
  - publicação (`POST /requests/:protocol/internal-notes`);
  - checkpoint de visualização (`PUT /requests/:protocol/internal-notes/read`);
  - contagem de não visualizadas (`unseenCount`).
- **Eventos da timeline** (extensão — decisões **D-N1**, **D-N12**): o `GET`
  devolve também eventos de `audit_history` das ações
  `request.assign`, `request.reassign`, `request.unassign`,
  `request.status_change` e `mapping.assign` (**D-N12**), com texto
  já renderizado no backend (**D-N3**, revisado em v1.3 → `text`).
  `request.triage`, `mapping.save` e `mapping.complete` **não** geram
  evento — sua informação vive nos históricos abaixo (D-N12).
- **Históricos completos** (extensão — decisões **D-N9**, **D-N14**): listas
  de topo `triages` e `mappings` — cada entrada o assessment/mapeamento
  completo daquela versão **mais** `occurredAt` do audit que a gerou,
  ordenadas `oldest → newest` para renderizar como tabelas. Sempre o
  histórico **completo** da solicitação, idêntico em todas as páginas
  paginadas (`triages: []` quando nunca triado; `mappings: []` quando
  nenhum mapeamento).
- Regra do badge: `unseenCount` continua contando **somente notas não lidas de
  outros autores**; eventos nunca alteram checkpoint nem badge (**D-N2**).
- **Paginação lazy (D-N5/D-N7/D-N8):** o `GET` **nunca** devolve a timeline
  inteira — pagina por keyset cursor, mais recente primeiro; o frontend carrega
  as páginas mais antigas sob demanda ao rolar para cima.

## 2. Fora de escopo

- **Demais entidades/ações de auditoria** — `request.update`, `pending_item.*`,
  `user.*`, `settings.*`, `prioritization.*` pertencem ao futuro contrato
  de log/auditoria (`GET /audit/:protocol`). `request.triage`,
  `mapping.save` e `mapping.complete` como **eventos** também ficam fora
  (D-N12) — seu conteúdo vive nos históricos `triages`/`mappings` (D-N14).
  Ver decisão **D-N6**.
- **Escritas de triagem e mapeamento** (`POST /requests/:protocol/triage`,
  `PUT /queue/requests/:protocol/mapping`) e as **rotas próprias de leitura**
  (`GET .../triage`, `GET .../mapping`) → contratos de origem
  (`contract-triage.md`; contrato de mapeamento BE #86).
  Os históricos `triages`/`mappings` são espelhos completos com
  `occurredAt`, sem rota própria nova; as abas Triagem/Mapeamento
  seguem donas da edição.
- **Pendências por campo** (`/pending-items`) → `formalizacao/pendencias.md`.
  Os eventos `request.status_change` gatilhados pelo ciclo de pendência
  **entram** na timeline (são `request.status_change`), mas o card de pendência
  em si não.
- **Mensagens com o solicitante / histórico de conversa** → tratativa.
- **Fluxo público/solicitante** — nada deste contrato é visível fora dos perfis
  internos (RN-007).
- **Edição/exclusão de notas e eventos** — ambos imutáveis (`audit_history` é
  só-INSERT).

## 3. Autenticação e autorização

- Rotas sob o prefixo montado em `router.ts`:
  `router.use("/requests/:protocol/internal-notes", internalNotesRoutes)`.
- **Sessão:** cookie **`session_id`** (JWT opaco `HttpOnly`, `SameSite=Lax`,
  `Secure` só em produção), front envia `credentials: "include"` — mesmo modelo
  do contrato `auth.md`.
- **Perfis permitidos:** `Analista`, `Gestor`, `Administrador`
  (`authMiddleware` + `requireRole` no router). `Solicitante` → `403`.
- Sem cookie/sessão inválida/expirada → `401`.
- Sessão no scope `change_password` → `403 Troca de senha obrigatórica antes de
continuar` (convenção `auth.md` §3).
- As três rotas (GET, POST, PUT) usam **exatamente** o mesmo gate; o perfil é
  relido do banco a cada request (não é confiado ao JWT).
- **Leitura embutida dos históricos `triages`/`mappings` (divergência
  consciente — D-N11):** `GET /requests/:protocol/triage` nega o Analista que
  não é responsável (`triage.service.ts:26-31` → `403 "Acesso negado a esta
solicitação"`); os históricos embutidos seguem o gate desta rota (3 perfis
  internos), sem o check de assignee. Ver decisão **D-N11**.
- Nenhum dado deste contrato é exposto em rotas públicas ou de acompanhamento.

## 4. Convenções transversais

Valem as convenções congeladas do template (`_template.md` §4): envelope de erro
`{ status: "error", statusCode, message }` com mensagens em pt-BR (`500` nunca
vaza detalhe); sucesso retorna o recurso direto; formato de `400`
(`Campos obrigatórios ausentes: <a, b>` e/ou `Campos inválidos: <campo> —
<motivo>`); datas ISO-8601 UTC (`2026-09-19T14:30:00.000Z`); IDs sempre **string**
no JSON (PK interna pode ser integer; `audit_id` e `internal_note_id` são BIGINT);
chaves/estruturas em inglês `camelCase`, valores de domínio (labels, statuses,
`text`) em pt-BR; sessão/TTL/cookie e CORS conforme `auth.md`.

> **Exceção de paginação registrada (D-N8):** o envelope paginado congelado
> `PaginatedResponse<T>` (`{ data, page, pageSize, total, totalPages }`) **não**
> se aplica a este domínio. A timeline usa **keyset cursor**
> (`{ items, nextCursor, unseenCount }` — §7): o offset clássico é instável sobre
> o merge de duas fontes (`request_internal_notes` + `audit_history`) e derruba
> páginas quando itens novos chegam entre requisições (a aba fica aberta).
> Ajustes de `limit`/`cursor` seguem o formato `400` do template.

## 5. Enums e vocabulários

| Enum                                   | Valores                                                                                                     | Fonte                                                       | Dono    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------- |
| `TimelineItemType`                     | `note` \| `event`                                                                                           | este contrato §7 (D-N1)                                     | Backend |
| `TimelineEventAction`                  | `request.assign` \| `request.reassign` \| `request.unassign` \| `request.status_change` \| `mapping.assign` | subconjunto de `auditCatalog.ts`, fixado em D-N4/D-N12      | Backend |
| `TimelineChangeOrigin`                 | `admin` \| `system` \| `internal`                                                                           | `audit_history.change_origin`                               | Backend |
| `InternalRole` (autor/ator)            | `Analista` \| `Gestor` \| `Administrador`                                                                   | `Exclude<Role, "Solicitante">` — capitalizado no JSON       | Produto |
| `RequestStatus` (composição de `text`) | os status vigentes do portal                                                                                | mesmos nomes compostos em `text` de `request.status_change` | Produto |

> `TimelineEventAction` é **lista fechada**: ações fora dela são ignoradas na
> leitura mesmo que existam em `audit_history` (`request.triage`,
> `mapping.save` e `mapping.complete` estão fora por D-N12). Adicionar uma
> ação nova é decisão de contrato.

## 6. Máquina de estados

O único estado deste domínio é o **checkpoint de leitura** (por
`(request_id, user_id)`), aplicado **somente a notas**:

```
sem checkpoint ──PUT /read { lastReadNoteId: N }──▶ checkpoint = N
checkpoint = N ──PUT /read { lastReadNoteId: M }, M > N──▶ checkpoint = M
checkpoint = N ──PUT /read { lastReadNoteId: M }, M < N──▶ checkpoint = N   (nunca regredir)
```

- Buscar a lista (GET) **não** altera o checkpoint; a marcação ocorre quando o
  frontend efetivamente carrega a aba e chama `PUT /read`.
- Eventos da timeline **nunca** participam do checkpoint: `lastReadNoteId`
  aceita apenas IDs de notas que pertençam à solicitação (`400` caso contrário).
- Notas do próprio usuário nunca aumentam `unseenCount`, mesmo após o
  checkpoint (publicação própria não gera badge).

## 7. Endpoints

| Método | Rota                                      | Auth                                                        | Response                                                                                       |
| ------ | ----------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| GET    | `/requests/:protocol/internal-notes`      | cookie `session_id` (`Analista`\|`Gestor`\|`Administrador`) | `200` `InternalNotesResponse` (página da timeline + `nextCursor` + `unseenCount` + históricos) |
| POST   | `/requests/:protocol/internal-notes`      | idem                                                        | `201` `TimelineNote`                                                                           |
| PUT    | `/requests/:protocol/internal-notes/read` | idem                                                        | `204` sem corpo                                                                                |

### Tipos

Os schemas de `TriageAssessment` e `MappingResponse` pertencem aos contratos
de origem (`contract-triage.md`; contrato de mapeamento BE #86) — aqui são
**referenciados, não redefinidos**.

```ts
// União da timeline (D-N1)
type TimelineItem = TimelineNote | TimelineEvent;

interface TimelineNote {
  type: "note";
  id: string; // internal_note_id (numérico) — usado no PUT /read
  content: string; // 1..4000 (trim), imutável
  createdAt: string; // ISO-8601 UTC
  author: { id: string; name: string; role: InternalRole };
}

interface TimelineEvent {
  type: "event";
  id: string; // `<audit_id>` namespaced: "audit:58"
  action: TimelineEventAction;
  text: string; // frase completa já renderizada no BE, pt-BR (§8)
  // ex.: "Status alterado: Em triagem" · "Responsável removido"
  occurredAt: string; // ISO-8601 UTC (audit_history.occurred_at)
  actor: { id: string; name: string; role: InternalRole } | null; // null = ação de sistema/usuário removido
  changeOrigin: TimelineChangeOrigin;
}

// Entradas dos históricos — snapshot + data do audit (D-N14).
// Ator/origem não são expostos aqui (removidos da API — a UI da tabela
// também não os exibe); eventos da timeline seguem com `actor`/`changeOrigin`.
interface TriageHistoryEntry {
  triage: TriageAssessment; // snapshot completo daquela versão
  occurredAt: string; // ISO-8601 da linha `request.triage` que a gerou
}

interface MappingHistoryEntry {
  mapping: MappingResponse; // snapshot completo (sem `occurredAt` próprio)
  occurredAt: string; // ISO-8601 da linha `mapping.*` que a gerou
}

interface InternalNotesResponse {
  items: TimelineItem[]; // página em ordem MAIS RECENTE PRIMEIRO (D-N7);
  // FE inverte para exibir (§8); máx. `limit` itens
  nextCursor: string | null; // cursor opaco da última posição da página;
  // null = não há página mais antiga (fim da timeline)
  unseenCount: number; // somente notas (D-N2); independente da página

  // Históricos completos (D-N14) — idênticos em TODAS as páginas,
  // independentes do cursor; ordenados `oldest → newest` para tabela.
  // Vazios: `[]` (nunca triado / nenhum mapeamento).
  triages: TriageHistoryEntry[];
  mappings: MappingHistoryEntry[];
}
```

Cursor (D-N8) — opaco para o cliente: base64url de
`{ "t": "<ISO-8601>", "type": "note" | "event", "id": "<id>" }`. O servidor só
aceita cursor que decodifique para essa forma; valor adulterado/inválido → `400`.
O cliente nunca interpreta o conteúdo — só repassa de resposta em resposta.

### GET /requests/:protocol/internal-notes — listar página da timeline

- **Auth:** cookie `session_id` (perfis internos).
- **Query:**
  - `limit` — inteiro `1..50`, default **20**; fora da faixa → `400`;
  - `cursor` — string opcional (cursor opaco acima). **Ausente = página mais
    recente** da timeline (lazy load inicial, D-N7).
- **Response:** `200` `InternalNotesResponse`.
- **Erros:** `400` protocolo/`limit`/`cursor` inválidos · `401` sessão · `403`
  `Solicitante` · `404` solicitação não encontrada.
- **Comportamento:** o serviço pagina o **merge de duas fontes** por keyset
  (algoritmo em §8), ordenado mais-recente-primeiro (D-N7):
  1. **Notas** — `request_internal_notes` ⋈ `users` (autor);
  2. **Eventos** — `audit_history` com filtro (**D-N12**):
     - `(entity_type = 'request' AND entity_id = :protocol AND action_type IN ('request.assign', 'request.reassign', 'request.unassign', 'request.status_change'))`
       **ou**
     - `(entity_type = 'mapping' AND entity_id IN (SELECT mapping_id FROM mappings WHERE request_id = :requestId) AND action_type = 'mapping.assign')`;
  - `:requestId` resolve do `:protocolo` da URL (solicitação inexistente → `404`
    **antes** de qualquer consulta).
  - **Históricos (D-N14):** além da página, a resposta traz `triages` e
    `mappings` completos — todos os `audit_history` da entidade reidratados
    para a lista (D-N14); **não paginados**, **mesmo conteúdo em toda página**,
    ordenados `oldest → newest` para renderizar como tabelas (vazios → `[]`).
    Sob o gate desta rota (§3, D-N11).
  - Página com menos de `limit` itens **ou** vazia → `nextCursor: null` no fim
    da timeline (pode ser `items: []` com `nextCursor: null` numa página final
    espremida — o cliente encerra o scroll-up).
- **`unseenCount`:** inalterado em relação ao contrato absorvido — contagem
  **global** de notas com `author ≠ usuário atual` **e** `id > checkpoint` (sem
  checkpoint, todas as notas de outros autores contam), calculada sobre a
  solicitação inteira, **não** sobre a página. Eventos não entram na conta
  (D-N2).
- **Get não marca lido** (mesma regra do contrato absorvido).

### POST /requests/:protocol/internal-notes — publicar nota

- **Auth:** cookie `session_id` (perfis internos).
- **Body:** `{ "content": "<1..4000 após trim>" }`
- **Response:** `201` `TimelineNote` completa (`type: "note"` incluído, para o
  frontend poder inserir na timeline sem transformação).
- **Autoria:** obtida exclusivamente da sessão (`user_id` +
  `author_role_at_creation`); o cliente nunca envia autoria.
- **Erros:** `400` `content` vazio/ausente ou > 4000
  (`A observação deve ter no máximo 4000 caracteres.`) · `401` · `403` · `404`.
- Publicar **não** avança o checkpoint do autor (nem gera badge para ele).

### PUT /requests/:protocol/internal-notes/read — marcar como visto

- **Auth:** cookie `session_id` (perfis internos).
- **Body:** `{ "lastReadNoteId": "12" }` — string numérica
  (`/^[1-9]\d*$/`), ID de **nota** BIGINT (string para não perder precisão).
- **Response:** `204` sem corpo.
- **Comportamento:** upsert do checkpoint com `GREATEST` — **nunca regredir**
  (requisições concorrentes/atrasadas com ID menor são ignoradas). A nota
  informada precisa pertencer à solicitação da URL.
- **Erros:** `400` ID malformado · `400`
  `Observação interna não pertence à solicitação` · `401` · `403` · `404`.
- **`markThrough`:** o frontend marca como visto a **nota mais recente já
  carregada** — na página inicial (sem cursor) é a primeira `type: "note"` da
  lista, que chega mais-recente-primeiro (D-N7). Carregar páginas antigas sob
  demanda **não** muda o checkpoint (só notas novas em relação a ele contariam,
  e elas só aparecem na página inicial).

- **Não** chamar `PUT /read` só por ter paginado mais antigas (buscar/paginar ≠
  marcar).

## 8. Regras de negócio

- **Ordem total canônica (merge):** timestamp ascendente — `createdAt` das
  notas, `occurredAt` dos eventos (ambos gravados com `now()` do banco).
  **Desempate determinístico:** (1) timestamp; (2) nota antes de evento; (3)
  `internal_note_id` crescente entre notas / `audit_id` crescente entre
  eventos. É a ordem em que a timeline é _exibida_ (mais antiga no topo).
- **Página vem invertida (D-N7):** o `GET` devolve a página **percorrendo a
  ordem canônica do fim para o início** — mais recente primeiro. O frontend
  **inverte cada página** para exibir na ordem canônica e, em scroll-up,
  **prepensa** páginas mais antigas acima da janela visível. Composer fixo no
  rodapé; `items[0]` da página sem cursor é o item mais novo da timeline.
- **Algoritmo de paginação (keyset, D-N8):** para cada fonte, buscar
  `limit + 1` itens **estritamente mais antigos** que o cursor (ou sem
  predicado na página inicial), em `ORDER BY` inverso da ordem canônica;
  merge das duas fontes pela ordem canônica inversa; cortar em `limit` e
  derivar `nextCursor` da **última posição da página** (o item mais antigo
  dela) = próximo lote será estritamente mais antigo. `limit + 1` por fonte
  garante detectar fim sem varrer a tabela inteira. Como notas e
  `audit_history` são imutáveis (ver abaixo), o predicado keyset é estável:
  páginas anteriores não deslizam quando notas/eventos novos chegam (eles só
  aparecem em páginas ainda não percorridas, mais para o topo).
- **Cursor opaco (D-N8):** base64url de `{ t, type, id }`; `type` ranka a
  ordem de desempate (nota < evento). O cliente repassa sem interpretar.
  Cursor válido porém de outra solicitação/registro não é caso especial —
  o predicado simplesmente não casa nada e devolve `items: []` +
  `nextCursor: null` (anti-IDOR implícito; a rota já exige sessão interna).
- **`unseenCount` global (D-N2):** calculado sobre **todas** as notas da
  solicitação a cada resposta de página (count direto, não deriva da página);
  eventos da timeline são contexto, não tarefas — não alteram
  `request_internal_note_read_states`.
- **Composição de `text` no backend (D-N3, revisado em v1.3):** o frontend
  exibe a frase pronta e **nunca** parseia `previous_value`/`newValue`/`note`
  brutos. Uma única string por evento, sempre presente, nunca `null`:

  | `action`                | `text` (frase completa, pt-BR)                                                                                                                                         |
  | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `request.status_change` | `Status alterado: <nome do status>` (`newValue`, já pt-BR)                                                                                                             |
  | `request.assign`        | `Responsável atribuído: <nome>` (`users.full_name` de `newValue`)                                                                                                      |
  | `request.reassign`      | `Responsável substituído: <nome>` (`users.full_name` de `newValue`)                                                                                                    |
  | `request.unassign`      | `Responsável removido` (sem sufixo)                                                                                                                                    |
  | `mapping.assign`        | `Responsável pelo mapeamento alterado: <nome>` (`full_name` via `details_professional` → `users`); quando `newValue` é `null` → `Responsável pelo mapeamento removido` |
  - `request.assign`/`reassign`/`unassign` gravam **`user_id`** em
    `previous_value`/`newValue` (resolução direta em `users`).
    `mapping.assign` grava **`professional_id`** (uuid) — resolução via
    `details_professional`.
  - Resolução falha (usuário/profissional removido do join) → sufixo omitido
    (frase sem `: <nome>`); o evento **nunca** é descartado por falha de
    resolução.
  - `request.triage`, `mapping.save` e `mapping.complete` **não** têm linha
    nesta tabela — não viram evento (D-N12); a data deles alimenta as
    proveniências dos históricos `triages`/`mappings` (ver abaixo).

- **`actor`:** `audit_history.user_id` LEFT JOIN `users` ⋈ `profiles`.
  `user_id` nulo (ação de sistema, ex. gatilho RN-010/mapping.complete, ou
  usuário removido — FK `SET NULL`) → `actor: null`. Diferente das notas
  (`author_role_at_creation`), **eventos não preservam perfil histórico**:
  `actor.role` é o perfil **vigente** do usuário no momento da leitura,
  capitalizado no JSON.
- **IDs namespaced:** notas mantêm o id numérico puro (compatível com
  `PUT /read`); eventos usam `audit:<audit_id>` — chaves únicas na união e
  pré-existem no contrato do frontend.
- **Imutabilidade:** notas sem rota de edição/exclusão; `audit_history` é
  só-INSERT (`audit-events.md` regra 4). Timeline não oferece mutação alguma —
  e é essa imutabilidade que torna o keyset seguro (D-N8).
- **Históricos completos (D-N14):** `triages`/`mappings` são **listas de
  snapshots** ordenadas `oldest → newest` — cada entrada o assessment/mapeamento
  daquela versão mais `occurredAt` do audit que a gerou. Idênticos em
  todas as páginas (não paginados; `[]` = nunca triado / nenhum mapeamento).
- **Sem dedupe (D-N10):** cada `POST .../triage` e cada `PUT .../mapping`
  gravam audit e uma entrada no seu histórico (`triages.length` ==
  `request.triage` count; `mappings.length` == número de rows em `mappings`).
- **Versionamento (D-N14):** `triages` (snapshot normalizado por colunas,
  `triage_id` = `TriageAssessment.id`) + `mappings` por `request_id`; a
  data (`occurred_at`) vem do `audit_history` (`request.triage` por
  `new_value->>'triageId'`; última `mapping.*` por `mapping_id`), sem colunas
  de proveniência nas tabelas. Ator e origem permanecem no `audit_history`,
  mas **não são expostos** nas entries dos históricos (a UI da tabela também
  não os exibe). Sem histórico parcial — primeira versão já é completa.
- **Escopo de eventos (D-N4/D-N12):** as 5 ações de `TimelineEventAction`.
  `request.triage`, `mapping.save`, `mapping.complete`, `request.update`,
  `pending_item.*` e demais entidades ficam de fora (D-N6/D-N12); filtros não
  são configuráveis por query.
- **Sem polling / cacheável por página:** não há endpoints separados de
  eventos; o frontend só refaz a página inicial no reload da aba (novidades
  aparecem lá, mais para o topo).
- **Referência de RF:** RN-007 (auditoria 100% interna) e RF12 (histórico com
  autor/data/origem) — a timeline é a materialização por protocolo dessas
  regras na aba de observações.

## 9. Erros

| Status | Quando                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------ |
| `400`  | Protocolo malformado (vazio) em params                                                           |
| `400`  | `limit` fora de `1..50` (GET)                                                                    |
| `400`  | `cursor` malformado — não decodifica para `{ t, type, id }` (GET)                                |
| `400`  | `content` vazio ou acima de 4.000 caracteres (POST)                                              |
| `400`  | `lastReadNoteId` fora de `/^[1-9]\d*$/` (PUT)                                                    |
| `400`  | `lastReadNoteId` não pertence à solicitação da URL (PUT)                                         |
| `401`  | Cookie ausente, sessão inválida/expirada, ou scope `change_password` nas rotas que não o aceitam |
| `403`  | Perfil `Solicitante`                                                                             |
| `404`  | Solicitação (protocolo) não encontrada — em qualquer das 3 rotas                                 |
| `500`  | Detalhe interno nunca vazado (envelope padrão)                                                   |

## 10. Exemplos

### GET — página inicial, mais recente primeiro (200)

`GET /requests/MAAT-8K3P-9X2M/internal-notes?limit=3`

`items` vem **invertido** (mais recente primeiro, D-N7) — o exemplo abaixo já
mostra a página como o servidor devolve; o FE exibe a ordem inversa. Os
históricos (`triages`/`mappings` + `occurredAt`) são **idênticos em toda
página** (D-N9).

```json
{
  "items": [
    {
      "type": "event",
      "id": "audit:63",
      "action": "request.status_change",
      "text": "Status alterado: Mapeamento agendado",
      "occurredAt": "2026-09-19T14:11:03.000Z",
      "actor": null,
      "changeOrigin": "system"
    },
    {
      "type": "event",
      "id": "audit:58",
      "action": "mapping.assign",
      "text": "Responsável pelo mapeamento alterado: Júlia Reis",
      "occurredAt": "2026-09-19T14:11:02.000Z",
      "actor": { "id": "9", "name": "Júlia Reis", "role": "Analista" },
      "changeOrigin": "internal"
    },
    {
      "type": "event",
      "id": "audit:52",
      "action": "request.assign",
      "text": "Responsável atribuído: Marcos Lima",
      "occurredAt": "2026-09-18T15:05:44.000Z",
      "actor": { "id": "2", "name": "Carla Dias", "role": "Administrador" },
      "changeOrigin": "admin"
    }
  ],
  "nextCursor": "eyJ0IjoiMjAyNi0wOC0xOFQxMTowNDo0NC4wMDBaIiwidHlwZSI6ImV2ZW50IiwiaWQiOiJhdWRpdDo1MiJ9",
  "unseenCount": 1,
  "triages": [
    {
      "triage": {
        "id": "6f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f",
        "adherentToScope": "Sim",
        "adherentJustification": "",
        "changeCategory": "Não",
        "newCategory": "",
        "preliminaryComplexity": "Média — integração com ERP do fornecedor exige mapeamento prévio.",
        "perceivedRisks": "Atraso na resposta do fornecedor sobre credenciais de API.",
        "suggestedResponsible": "Júlia Reis",
        "suggestedResponsibleJustification": "Conhece a integração ERP anterior do mesmo fornecedor.",
        "exitStatus": 7,
        "result": "Elegível para avaliação",
        "conclusionJustification": "Dentro do escopo do NEO; seguir para priorização."
      },
      "occurredAt": "2026-09-18T15:02:10.000Z"
    }
  ],
  "mappings": [
    {
      "mapping": {
        "protocol": "MAAT-8K3P-9X2M",
        "id": "b7e4d9c1-2a3f-4e8b-9c6d-5f1a2b3c4d5e",
        "scheduledFor": "2026-09-22T18:00:00.000Z",
        "durationMinutes": 60,
        "modality": "REMOTE",
        "meetingLink": "https://meet.example.com/maat-8k3p",
        "location": null,
        "participants": [
          { "id": "12", "name": "Carlos Eduardo Silva", "email": "carlos.silva@empresa.com.br" },
          { "id": null, "name": "Fornecedor Acme", "email": "contato@acme.com" }
        ],
        "notes": "Levar checklist da última integração.",
        "mappingAssignee": {
          "id": "d3e2f1a0-b9c8-4d7e-8f6a-1b2c3d4e5f60",
          "userId": "9",
          "name": "Júlia Reis",
          "email": "julia.reis@neo.com.br",
          "jobTitle": "Analista de Processos"
        }
      },
      "occurredAt": "2026-09-19T14:11:02.000Z"
    }
  ]
}
```

> `nextCursor` = posição do último item da página (o mais antigo dela,
> `audit:52`) — a próxima requisição trará estritamente mais antigos.
> `unseenCount: 1` conta a nota `id: "2"` da timeline **inteira** (de outro
> autor, após o checkpoint), mesmo ela não estar nesta página (D-N2/D-N8).
> `triages`/`mappings` vêm idênticos em toda página (D-N14) — tabelas
> `oldest→newest` fora da lista paginada.

### GET — página seguinte via cursor (200)

`GET /requests/MAAT-8K3P-9X2M/internal-notes?limit=3&cursor=eyJ0IjoiMjAyNi0wOC0xOFQxMTowNDo0NC4wMDBaIiwidHlwZSI6ImV2ZW50IiwiaWQiOiJhdWRpdDo1MiJ9`

```json
{
  "items": [
    {
      "type": "note",
      "id": "2",
      "content": "A área responsável foi acionada e deve retornar até o fim do dia.",
      "createdAt": "2026-09-18T16:20:00.000Z",
      "author": { "id": "2", "name": "Marcos Lima", "role": "Gestor" }
    },
    {
      "type": "event",
      "id": "audit:44",
      "action": "request.status_change",
      "text": "Status alterado: Em triagem",
      "occurredAt": "2026-09-18T15:02:10.000Z",
      "actor": { "id": "7", "name": "Ana Souza", "role": "Analista" },
      "changeOrigin": "admin"
    },
    {
      "type": "note",
      "id": "1",
      "content": "Os critérios iniciais foram revisados. Precisamos confirmar a alçada de aprovação antes do mapeamento.",
      "createdAt": "2026-09-18T13:45:00.000Z",
      "author": { "id": "7", "name": "Ana Souza", "role": "Analista" }
    }
  ],
  "nextCursor": null,
  "unseenCount": 1,
  "triages": [{ "…": "idêntico à página anterior (D-N14 — tabela completa)" }],
  "mappings": [{ "…": "idêntico à página anterior (D-N14 — tabela completa)" }]
}
```

> Página final: `nextCursor: null` — o FE encerra o scroll-up (não há mais
> nada mais antigo). Triagens e mapeamentos vivem nas tabelas `triages`/`mappings`
> (D-N14), fora da lista paginada.

### GET — timeline vazia (200)

```json
{
  "items": [],
  "nextCursor": null,
  "unseenCount": 0,
  "triages": [],
  "mappings": []
}
```

> Nunca triado (`triages: []`) e nenhum mapeamento (`mappings: []`).

### POST — publicar nota (201)

```json
// Request
{ "content": "Confirmar alçada com o financeiro na sexta." }

// Response
{
  "type": "note",
  "id": "3",
  "content": "Confirmar alçada com o financeiro na sexta.",
  "createdAt": "2026-09-22T17:12:00.000Z",
  "author": { "id": "7", "name": "Ana Souza", "role": "Analista" }
}
```

### PUT — marcar como visto (204)

```http
PUT /requests/MAAT-8K3P-9X2M/internal-notes/read HTTP/1.1
Cookie: session_id=<jwt>
Content-Type: application/json

{ "lastReadNoteId": "3" }
```

Sem corpo na resposta.

### Erro (403)

```json
{ "status": "error", "statusCode": 403, "message": "Acesso restrito aos perfis internos" }
```

## 11. Implementação

- **Frontend:**
  - `src/lib/types/internal-note.ts`: `InternalNotesResponse` com
    `TimelineItem[]` + `nextCursor` + `triages`/`mappings` history;
  - `internal-note.api.ts` / `internal-note.service.ts`: `getInternalNotes`
    aceita `{ limit?, cursor? }`;
  - `InternalNotesSection.svelte`: `event.text` direto + ramificação por
    `type`; **tabelas** `triages`/`mappings` fora da lista (não paginam);
    paginação invertida + prepend.
- **Backend:**
  - `internalNotes.service`: merge paginado com keyset (5 ações, D-N12) +
    listagem dos históricos por `request_id` sob o gate da rota (D-N11);
  - **Migração:** `create_triages` (`triage_id` uuid PK = `TriageAssessment.id`,
    snapshot normalizado + `request_id`; proveniência via `audit_history`);
    `mappings` já versionado por `request_id`.
- Contratos não substituídos: `pendencias.md`, triagem, mapeamento, futuro
  `audit`.

## 12. Decisões

### Fechadas

| ID    | Decisão                                                                                                                                                                                                                                                                    | Origem                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| D-N1  | Estender `GET /internal-notes` (união `{ type: "note" \| "event" }`) em vez de endpoint novo ou `GET /audit/:protocol` — POST/PUT intocados                                                                                                                                | conversa de revisão, 2026-09-22 |
| D-N2  | `unseenCount` conta **somente notas**; checkpoint `last_read_note_id` inalterado; eventos nunca sobem badge                                                                                                                                                                | conversa, 2026-09-22            |
| D-N3  | Payload do evento = `text` frase completa já renderizada no BE, pt-BR (revisado em v1.3 — antes `summary` + `value`); FE não parseia JSON bruto de auditoria                                                                                                               | conversa, 2026-09-22            |
| D-N4  | Escopo v1 dos eventos: `request.triage`, `request.status_change`, `request.assign`, `request.reassign`, `request.unassign`, `mapping.save`, `mapping.complete`, `mapping.assign` (inclui status + atribuição) — **revisado em v1.2 por D-N12**                             | conversa, 2026-09-22            |
| D-N5  | Timeline **nunca** carrega lista inteira: GET paginado com lazy load no FE (fecha a opção "manter lista única" da v1.0)                                                                                                                                                    | conversa, 2026-09-22            |
| D-N7  | Lazy load **newest-first + scroll-up**: primeira página = N mais recentes; FE inverte para exibir e prepensa páginas mais antigas; composer fixo embaixo                                                                                                                   | conversa, 2026-09-22            |
| D-N8  | Envelope **keyset cursor** `{ items, nextCursor, unseenCount }` (exceção registrada em §4 ao `PaginatedResponse`); cursor opaco `{ t, type, id }`                                                                                                                          | conversa, 2026-09-22            |
| D-N9  | **Históricos top-level** no GET: `triages[]` e `mappings[]` — cada entrada snapshot completo + `occurredAt`, sem ator/origem (`TriageHistoryEntry`/`MappingHistoryEntry`), `oldest→newest`, idêntico em toda página; substitui `triage`/`mapping` singular de v1.2 (D-N14) | conversa, 2026-09-22            |
| D-N10 | Não é log completo; **sem dedupe** (cada save gera uma entrada no seu histórico)                                                                                                                                                                                           | conversa, 2026-09-22            |
| D-N12 | Timeline enxuta: **5 ações** (`request.assign/reassign/unassign`, `request.status_change`, `mapping.assign`). **Saem** `request.triage`, `mapping.save`, `mapping.complete` — conteúdo já vive nos históricos (D-N9/D-N14)                                                 | conversa, 2026-09-22            |
| D-N14 | Históricos versionados: `triages` (snapshot normalizado; proveniência via `audit_history`) + `mappings` por `request_id` (`oldest→newest`)                                                                                                                                 | conversa, 2026-09-22            |
| D-N13 | Alinhar família `Responsável …`: `mapping.assign` `text` → `Responsável pelo mapeamento alterado: <nome>` / `Responsável pelo mapeamento removido` (antes `Designação de mapeamento alterada`)                                                                             | conversa, 2026-09-22            |
| D-N6  | `request.update` e `pending_item.*` **não** entram na timeline — pertencem ao futuro `GET /audit/:protocol`                                                                                                                                                                | conversa, 2026-09-22            |
| D-N11 | O histórico de triagem embutido (`triages`) é acessível aos 3 perfis internos sob o gate desta rota, **sem** o check de assignee do `GET .../triage`                                                                                                                       | conversa, 2026-09-22            |

> Sem decisões abertas: **D-N6** e **D-N11** foram fechadas em 2026-09-22 (opção (a) em ambas).
