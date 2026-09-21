# Contrato de API — Triagem (Internal)

Contrato de comunicação Frontend ↔ Backend para a etapa de triagem interna:
aba `Triagem` em `/(admin)/fila/[protocolo]`, criação sequencial de triagens
e resolução de `exitStatus` via `PortalConfig.statuses`.

- Fonte de verdade: este arquivo + `contratos/solicitations-api-requests-0_5.md`
  (base do ciclo de vida `RequestStatus`/`RequestCategory`) e
  `docs/produto/fluxos/` — divergências de logs de auditoria mantidas em
  `contratos/fluxo-solicitante/divergencias-analise-contrato.md` apenas como trilha.
- Épico: `frontend/issues/epics/backend-integration-sprint4/epic.md`
- Referências: `src/lib/types/triage.ts`, `src/lib/types/request.ts`,
  `src/lib/types/portal-config.ts`, `src/lib/api/triage.api.ts`,
  `src/routes/(admin)/fila/[protocolo]/components/triagem/triage-validation.ts`,
  `docs/produto/business-logic.md` (RN-004 — fila do analista)
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`
  e, em `422`, opcional `fields?: Record<string,string>` para erros por campo

---

## Tipos compartilhados

```ts
// Categorias: lista administrável por CRUD em /portal-config/categories
// (Card 5, src/lib/types/portal-config.ts:53). `id` é PK estável —
// inteiro positivo (1..10 nos defaults, gerado no cliente como max+1
// em itens novos e aceito pela API). `isActive` mantém histórico.
// Ver contratos/portal-config-api-0_4.md §6 + Anexo A.
export interface PortalCategory {
  id: number; // inteiro positivo estável — gerado no cliente ao criar categoria, aceito pela API
  name: string; // 1..40, único case-insensitive
  description: string; // max 200
  isActive: boolean;
}

// União das 10 categorias base (solicitations-api-requests-0_5.md).
// É o valor que trafega hoje em DemandBlock.category / newCategory
// (name-string, validado contra o cadastro ativo — ver TODO abaixo).
export type RequestCategory =
  | "Automação"
  | "Melhoria de processo"
  | "Indicador"
  | "Dashboard ou relatório"
  | "Análise de dados"
  | "Padronização"
  | "Revisão de processo"
  | "Apoio técnico"
  | "Estudo de viabilidade"
  | "Outros";

// Status do ciclo de vida — lista gerenciada em PortalConfig.statuses
// (Card 6, src/lib/types/portal-config.ts:136). `id` é PK estável —
// inteiro positivo (1..17 nos defaults de portal-defaults.ts,
// gerado no cliente como max+1 em itens novos e aceito pela API).
// `closesRequest` encerra a solicitação (Concluído/Cancelado);
// `isTriageExit` marca as saídas elegíveis da triagem — distinto de
// `closesRequest` pois "Pendente de informações" é saída sem encerrar.
export interface PortalStatus {
  id: number; // inteiro positivo estável — gerado no cliente ao criar status, aceito pela API
  name: string; // 1..40, único case-insensitive
  visibility: "PUBLIC" | "INTERNAL";
  closesRequest: boolean;
  isTriageExit: boolean; // NOVO — true nos status que podem ser exitStatus da triagem
  tone: "error" | "success" | "info" | "warning" | "neutral";
  isActive: boolean; // false = inativo (permanece no histórico, não entra em novos fluxos)
}

// Avaliação de triagem — cada POST gera um id novo (uuid do registro,
// gerado pelo backend — NÃO confundir com os ids numéricos de
// PortalCategory/PortalStatus). Nunca há duas triagens simultâneas;
// apenas sequenciais — a última retornada por GET /triage é a vigente.
// Histórico completo é GET /triages (futuro).
export interface TriageAssessment {
  id: string; // uuid v4 do registro — gerado pelo backend no POST, readonly no GET
  adherentToScope: "Sim" | "Não" | ""; // obrigatório
  adherentJustification: string; // 1000, obrigatório se adherentToScope === "Não"
  changeCategory: "Sim" | "Não" | ""; // obrigatório
  newCategory: RequestCategory | ""; // name-string (igual a DemandBlock.category — mantido por ora, ver TODO abaixo); obrigatório se changeCategory === "Sim"; deve estar ativo no cadastro
  preliminaryComplexity: string; // 4000, obrigatório se adherentToScope === "Sim"
  perceivedRisks: string; // 4000, obrigatório se adherentToScope === "Sim"
  suggestedResponsible: string; // 150, opcional
  suggestedResponsibleJustification: string; // 1000, opcional
  exitStatus: number; // id numérico de PortalStatus.id — obrigatório; deve ter isTriageExit===true && isActive===true
  result: string; // 1000, obrigatório
  conclusionJustification: string; // 4000, obrigatório
}

// TODO(later): avaliar migração de DemandBlock.category / TriageAssessment.newCategory
// de name-string para CategoryId:number (FK de PortalCategory.id). Breaking para
// POST /requests, GET /internal, side-effects da triagem, StepDemand/TriageSection/
// InfoSection, mocks e backend (findActiveCategoryId). Mantido como name-string por ora.

// Criação — body do POST (sem id, sem timestamps do servidor)
export type CreateTriagePayload = Omit<TriageAssessment, "id">;

// DTO interno — superconjunto lido por GET /requests/:protocol/internal
// Não contém triagem — recurso separado via GET /triage (ver §2); DemandBlock.category é
// RequestCategory (name-string, igual ao POST /requests — ver TODO acima)
export interface InternalRequestDetail {
  protocol: string;
  status: RequestStatus; // matriz pública de 17 valores (solicitations-api-requests-0_5.md §Tipos) — derivado de exitStatus via name
  // ... demais blocos: requester, demand (category: RequestCategory), operational, complementary, assignee, prioritization
}
```

> Legado `TriageResult` (7 literais: `Elegível para avaliação`, `Pendente de informações`,
> `Fora do escopo`, `Direcionada para outra área`, `Duplicada`, `Cancelada`, `Backlog`)
> **removido** — `exitStatus` não trafega mais como literal, e sim como
> `PortalStatus.id` (number). O frontend deriva as opções de
> `portalConfig.statuses.filter(s => s.isActive && s.isTriageExit)` (value = `id`,
> label = `name`) e o backend valida contra a mesma lista. Os 7 nomes devem
> existir como `PortalStatus` com `isTriageExit: true` (ver
> `src/lib/config/portal-defaults.ts` — ids numéricos 1..17 já existentes;
> atenção para `Cancelada` vs `Cancelado` já presente nos defaults).

---

## 0. Modo transversal e autenticação

Os dois endpoints de triagem respeitam `PUBLIC_API_URL` + `credentials: include`
(cookie `session_id`), igual a `solicitations-api-requests-0_5.md §0`. Em `dev`
o frontend usa `MOCK_DOMAINS.triage` (`src/lib/mocks/index.ts`).

| Endpoint                           | Autenticação                | Permissão                                                                    |
| ---------------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `POST /requests/:protocol/triage`  | exige sessão                | só `Administrador` ou `assignee` atual da solicitação → `403` caso contrário |
| `GET /requests/:protocol/triage`   | exige sessão                | mesma regra — `403` se não for `Admin` nem `assignee`                        |
| `GET /requests/:protocol/internal` | exige sessão (fila interna) | mesma regra                                                                  |

- Sem sessão válida: `401` no envelope padrão.
- Implementado pelo guard `canEditSolicitation(assigneeId, user)` (`src/lib/services/access.service`)
  espelhando RN-004.

---

## 1. POST /requests/:protocol/triage — Criar triagem

Cria uma nova triagem. **Não idempotente**: cada chamada gera `id` novo (uuid do registro).
Nunca há duas triagens simultâneas — apenas sequenciais; a última retornada por
`GET /triage` é a vigente. Histórico pode ser exposto futuramente via `GET /triages`.

**Request**

```http
POST /requests/MAAT-8K3P-9X2M/triage HTTP/1.1
Content-Type: application/json
Cookie: session_id=<sessão>

{
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Média — integração com sistema de ponto e validação de regras externas",
  "perceivedRisks": "Divergência em marcações manuais e impacto na folha de pagamento",
  "suggestedResponsible": "Ana Souza",
  "suggestedResponsibleJustification": "Experiência prévia com automação de ponto",
  "exitStatus": 9,
  "result": "Encaminhado para mapeamento detalhado",
  "conclusionJustification": "Demanda aderente ao escopo de automação com benefício claro de eficiência"
}
```

```ts
// Body — CreateTriagePayload
export type CreateTriagePayload = Omit<TriageAssessment, "id">;
// exitStatus é PortalStatus.id (number) — frontend envia value numérico do FilterSelect
```

**Response 201** — `TriageAssessment` completo:

```ts
export interface TriageAssessment {
  id: string; // "660e8400-e29b-41d4-a716-446655440100"
  adherentToScope: "Sim" | "Não" | "";
  // ... demais campos iguais ao body
}
```

```json
HTTP/1.1 201 Created

{
  "id": "660e8400-e29b-41d4-a716-446655440100",
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Média — integração com sistema de ponto e validação de regras externas",
  "perceivedRisks": "Divergência em marcações manuais e impacto na folha de pagamento",
  "suggestedResponsible": "Ana Souza",
  "suggestedResponsibleJustification": "Experiência prévia com automação de ponto",
  "exitStatus": 9,
  "result": "Encaminhado para mapeamento detalhado",
  "conclusionJustification": "Demanda aderente ao escopo de automação com benefício claro de eficiência"
}
```

**Efeitos colaterais atômicos** (mesma transação):

```ts
triage = { id: randomUUID(), ...body }; // backend gera uuid do registro, persistido como última triagem do protocolo
if (changeCategory === "Sim") {
  // newCategory é RequestCategory (name-string — mantido por ora, ver TODO em §Tipos)
  demand.category = newCategory; // GET /internal retorna o nome, igual ao POST /requests
}
status = portalConfig.statuses.find((s) => s.id === exitStatus)!.name; // id numérico → name; não armazena id em status
lastUpdate = now().toISOString();
// GET /requests/:protocol/triage retorna a triagem vigente (objeto) ou null
```

**Exemplo real — criação com troca de categoria:**

```http
POST /requests/MAAT-7C4F-1NXR/triage HTTP/1.1
Content-Type: application/json
Cookie: session_id=abc

{
  "adherentToScope": "Não",
  "adherentJustification": "Fora do escopo de automação — demanda de apoio técnico pontual",
  "changeCategory": "Sim",
  "newCategory": "Apoio técnico",
  "preliminaryComplexity": "Baixa — atendimento único sem integração",
  "perceivedRisks": "Nenhum risco relevante",
  "suggestedResponsible": "",
  "suggestedResponsibleJustification": "",
  "exitStatus": 13,
  "result": "Direcionada para atendimento de apoio",
  "conclusionJustification": "Não aderente ao escopo de automação, mas elegível para apoio"
}
```

> `newCategory: "Apoio técnico"` = `RequestCategory` (name-string, mantido por ora — ver TODO
> em §Tipos). Frontend obtém as opções via `portalConfig.categories` (nomes ativos).

**Response — `201 Created`:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440200",
  "adherentToScope": "Não",
  "adherentJustification": "Fora do escopo de automação — demanda de apoio técnico pontual",
  "changeCategory": "Sim",
  "newCategory": "Apoio técnico",
  "preliminaryComplexity": "Baixa — atendimento único sem integração",
  "perceivedRisks": "Nenhum risco relevante",
  "suggestedResponsible": "",
  "suggestedResponsibleJustification": "",
  "exitStatus": 13,
  "result": "Direcionada para atendimento de apoio",
  "conclusionJustification": "Não aderente ao escopo de automação, mas elegível para apoio"
}
```

**Exemplo de erro — `exitStatus` inativo:**

```json
HTTP/1.1 422 Unprocessable Entity

{
  "status": "error",
  "statusCode": 422,
  "message": "Validação falhou",
  "fields": {
    "exitStatus": "Status de saída deve ser um status ativo elegível para triagem"
  }
}
```

**Exemplo de erro — campo obrigatório:**

```json
HTTP/1.1 422 Unprocessable Entity

{
  "status": "error",
  "statusCode": 422,
  "message": "Validação falhou",
  "fields": {
    "adherentJustification": "Informe a justificativa quando não aderente ao escopo",
    "exitStatus": "Selecione o status de saída"
  }
}
```

**Erros:**

| Status | Quando                                                                 |
| ------ | ---------------------------------------------------------------------- |
| 401    | Sem sessão / cookie inválido                                           |
| 403    | Usuário não é `Administrador` nem `assignee` atual da solicitação      |
| 404    | Protocolo inexistente                                                  |
| 422    | Validação — body fora dos limites abaixo (envelope `fields` por campo) |
| 500    | Erro genérico                                                          |

**Validações `422` (espelham `src/routes/(admin)/fila/[protocolo]/components/triagem/triage-validation.ts:49`):**

| Campo                               | Regra                                                                                                                                                               | Limite |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `adherentToScope`                   | obrigatório (`Sim`\|`Não`)                                                                                                                                          | —      |
| `adherentJustification`             | obrigatório se `adherentToScope === "Não"`, trim não-vazio                                                                                                          | 1000   |
| `changeCategory`                    | obrigatório (`Sim`\|`Não`)                                                                                                                                          | —      |
| `newCategory`                       | obrigatório se `changeCategory === "Sim"`, `RequestCategory` válido e ativo no cadastro (`portalConfig.categories.some(c => c.name === newCategory && c.isActive)`) | —      |
| `preliminaryComplexity`             | obrigatório se `adherentToScope === "Sim"`, trim não-vazio                                                                                                          | 4000   |
| `perceivedRisks`                    | obrigatório se `adherentToScope === "Sim"`, trim não-vazio                                                                                                          | 4000   |
| `suggestedResponsible`              | opcional                                                                                                                                                            | 150    |
| `suggestedResponsibleJustification` | opcional                                                                                                                                                            | 1000   |
| `exitStatus`                        | obrigatório, inteiro positivo, `portalConfig.statuses.find(s => s.id === exitStatus && s.isActive && s.isTriageExit)`                                               | —      |
| `result`                            | obrigatório, trim não-vazio                                                                                                                                         | 1000   |
| `conclusionJustification`           | obrigatório, trim não-vazio                                                                                                                                         | 4000   |

- Trim de strings antes de validar/persistir.
- Limpar `adherentJustification` quando `adherentToScope !== "Não"` e `newCategory` quando `changeCategory !== "Sim"` (evita persistência de seleção anterior — `toTriagePayload`).
- Sem truncamento silencioso — violação → `422` com campo indicado.

---

## 2. GET /requests/:protocol/triage — Buscar triagem

Busca a triagem do protocolo. Frontend envia apenas `protocol` — backend retorna a triagem ou `null`.

O frontend busca `GET /triage` de forma lazy, apenas quando a aba Triagem é aberta (`?aba=triagem` → `TriageSection` monta). Não é em paralelo ao page load (`GET /internal`). Se `GET /triage` retorna `null`, tab abre em edição com `createEmptyTriageAssessment()`; se retorna objeto, tab abre em readonly.

```text
GET /requests/MAAT-8K3P-9X2M/triage
```

**Response 200** — `TriageAssessment | null`:

```json
HTTP/1.1 200 OK

{
  "id": "660e8400-e29b-41d4-a716-446655440100",
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Média — integração com sistema de ponto",
  "perceivedRisks": "Divergência em marcações manuais",
  "suggestedResponsible": "Ana Souza",
  "suggestedResponsibleJustification": "Experiência prévia com automação de ponto",
  "exitStatus": 9,
  "result": "Encaminhado para mapeamento detalhado",
  "conclusionJustification": "Demanda aderente ao escopo"
}
```

Quando nunca triado, `200` com `null`:

```json
HTTP/1.1 200 OK

null
```

> Futuro: `GET /requests/:protocol/triages` → `TriageAssessment[]` ordenado por `createdAt` desc (histórico).

**Erros:**

| Status | Quando                                          |
| ------ | ----------------------------------------------- |
| 401    | Sem sessão                                      |
| 403    | Sem permissão (mesma regra `Admin`\|`assignee`) |
| 404    | Protocolo inexistente                           |
| 500    | Erro genérico                                   |

---

## 3. GET /requests/:protocol/internal — Detalhe interno (parte triagem)

`GET /internal` é o superconjunto administrativo (`src/lib/types/request.ts:407`). Triagem **não** está mais embutida — recurso separado via `GET /triage` (§2):

```ts
// Trecho de InternalRequestDetail lido por GET /requests/:protocol/internal
export interface InternalRequestDetailTriagem {
  protocol: string;
  status: RequestStatus; // derivado de exitStatus via name — ver POST side effects
  // triage removido — usar GET /requests/:protocol/triage
  // ... requester, demand, operational, assignee, prioritization
}
```

**Exemplo — `GET /internal` (sem triagem):**

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Em triagem",
  "demand": { "category": "Automação", "title": "Automatizar conferência de diárias" }
  // category é RequestCategory (name-string, igual ao POST /requests — ver TODO em §Tipos)
  // triagem obtida via GET /requests/MAAT-8K3P-9X2M/triage → null neste caso
}
```

**Exemplo — após triagem (status derivado):**

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Aguardando mapeamento",
  "demand": { "category": "Automação" },
  "lastUpdate": "2026-08-26T10:12:40.000Z"
  // triagem obtida via GET /triage → { id: "660e...440100", ... } (id é uuid do registro)
}
```

**Fluxo frontend** (`SpecTabs.svelte` + `TriageSection.svelte`):

1. Page load busca só `GET /internal` (sem triagem)
2. Ao abrir a aba Triagem (`?aba=triagem` → `TriageSection` monta), dispara `GET /triage` por `protocol`
3. Se `GET /triage` retorna objeto → renderiza tab em **readonly** (inputs `disabled`, sem `Salvar`)
4. Se `GET /triage` retorna `null` → tab abre em edição (`createEmptyTriageAssessment()`)
5. Se readonly e `canEditSolicitation(assigneeId, user)` (`Admin|assignee`) → botão `Começar Nova Triagem` → `draft = createEmptyTriageAssessment(); isCreatingNew = true` → `POST` cria, próximo `GET /triage` retorna novo objeto e volta a readonly

`status`, `demand.category`, `lastUpdate` continuam derivados do `POST` (backend); mocks espelham via `sessionStorage` (`maat:triage:{protocol}`) quando necessário.

---

## 4. PortalConfig — `isTriageExit`

Novo campo em `PortalStatus` para distinguir saída de triagem de encerramento:

```ts
// src/lib/types/portal-config.ts:136
export interface PortalStatus {
  id: number;
  name: string;
  visibility: "PUBLIC" | "INTERNAL";
  closesRequest: boolean; // encerra solicitação (Concluído/Cancelado)
  isTriageExit: boolean; // NOVO — elegível como exitStatus da triagem
  tone: "error" | "success" | "info" | "warning" | "neutral";
  isActive: boolean;
}
```

- `closesRequest` = terminal (ex: `Concluído` `id 16`, `Cancelado` `id 17` nos defaults).
- `isTriageExit` = elegível como saída (inclui `Pendente de informações`, `Fora do escopo`, `Direcionada para outra área`, `Duplicada`, `Backlog`, `Elegível para avaliação` mesmo que `closesRequest === false`).

Backend valida `exitStatus` contra `statuses.filter(s => s.isActive && s.isTriageExit)`. Frontend filtra `portalConfig.statuses` para `FilterSelect`:

```ts
// TriageSection.svelte
const exitOptions = $derived(
  portalConfig.statuses
    .filter((s) => s.isActive && s.isTriageExit)
    .map((s) => ({ value: s.id, label: s.name })),
);
```

Migração: semear `isTriageExit: true` nos 7 status de triagem em `src/lib/config/portal-defaults.ts` e `src/lib/mocks/portal-config.mock.ts` (ids numéricos existentes, sem mudar o tipo de `id`); mapear literais antigos (`Cancelada` → `Cancelado` já existente) ou criar novos registros com ids numéricos sequenciais (max+1). **Categorias**: sem migração de `id` — `PortalCategory.id` permanece `number` (1..10); apenas validar `newCategory`/`demand.category` (name-string) contra nomes ativos.

---

## Observações do contrato

- Valores de `status`, `priority`, `category` são strings PT-BR; chaves/estruturas em inglês (CONTRIBUTING §1).
- Limites de caracteres (Especificação 3.0 §4) espelhados entre UI (`maxLength` + contador visual) e backend/banco; payload fora dos limites → `422` com `fields`, sem truncamento silencioso.
- `exitStatus` não é mais `TriageResult` — remover enum hardcoded do frontend (`src/lib/types/triage.ts:32` `TRIAGE_EXIT_OPTIONS` → derivado de `PortalStatus` filtrado por `isActive && isTriageExit`, value = `id` numérico). Backend não aceita literais antigos.
- `newCategory` e `DemandBlock.category` permanecem `RequestCategory` (name-string) por ora — ver TODO em §Tipos. Frontend deriva `FilterSelect` de `portalConfig.categories` (nomes ativos); backend valida contra o cadastro ativo (não aceita categoria inativa/inexistente).
- `triage.id` é uuid v4 do registro gerado no `POST` (distinto dos ids numéricos de PortalCategory/PortalStatus); frontend nunca envia `id` no body (`Omit<TriageAssessment,"id">`).
- Trim e limpeza condicional (`adherentJustification` quando `adherentToScope !== "Não"`, `newCategory` quando `changeCategory !== "Sim"`) espelham `triage-validation.ts:28`.
- Histórico: `GET /triage` retorna a última triagem ou `null`; `GET /triages` (lista) é escopo futuro.
- Departamento `select` híbrido e tipos `RequestCategory` seguem `solicitations-api-requests-0_5.md §Tipos compartilhados`.
- Pendência: semear `isTriageExit: true` nos 7 `PortalStatus` de triagem em `portal-defaults` (ids numéricos existentes; atenção à divergência `Cancelada` vs `Cancelado`).
