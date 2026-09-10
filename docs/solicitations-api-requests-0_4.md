# Contrato de API — Fluxo do Solicitante (Requests)

Contrato de comunicação Frontend ↔ Backend para o fluxo do solicitante:
Formulário de Demanda, página Acompanhar Solicitações e página da solicitação
(`/acompanhar/[protocolo]`).

- Fonte de verdade: `contratos/fluxo-solicitante/# Especificação de Produto &
  Engenharia — Sistema de Gestão de Demandas (Intake) 3.0.md` — as decisões
  D-01 a D-07 consolidadas em sua seção 3 prevalecem sobre registros anteriores
  (`contratos/fluxo-solicitante/divergencias-analise-contrato.md`, mantido
  apenas como trilha histórica).
- Épico: `frontend/issues/epics/backend-integration-sprint4/epic.md`
- Referências: `docs/produto/fluxos/criacao-de-solicitacao.md`,
  `docs/produto/fluxos/consulta-de-solicitacao.md`, `docs/produto/requests.md` (RF01–RF03, RF09, RF12),
  `docs/produto/business-logic.md` (RN-003, RN-005, RN-006, RN-008)
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Tipos compartilhados

```ts
// Status visíveis ao solicitante — matriz pública de 17 valores
// (docs/produto/fluxos/README.md). O vocabulário interno da triagem
// ("Resultado da Triagem" — RF04 / Especificação 3.0 §7.3) não trafega no
// campo status: aparece somente em conclusion.result via TriageResult.
export type RequestStatus =
  | "Solicitação enviada"
  | "Aguardando triagem"
  | "Em triagem"
  | "Pendente de informações"
  | "Aguardando mapeamento"
  | "Mapeamento agendado"
  | "Em mapeamento"
  | "Em análise de viabilidade"
  | "Elegível"
  | "Não elegível"
  | "Priorizado"
  | "Backlog"
  | "Direcionado para outra área"
  | "Em desenvolvimento"
  | "Em homologação"
  | "Concluído"
  | "Cancelado";

// Especificação 3.0 §8 — faixas de priorização/criticidade
export type RequestPriority = "Baixa" | "Média" | "Alta" | "Crítica";

// Resultado da Triagem (RF04; Especificação 3.0 §7.3, coluna §9.2) — os 7
// vereditos que o analista registra ao concluir a etapa; materializam como
// resultado da conclusão da análise (RequestDetail.conclusion.result).
export type TriageResult =
  | "Elegível para avaliação"
  | "Pendente de informações"
  | "Fora do escopo"
  | "Direcionada para outra área"
  | "Duplicada"
  | "Cancelada"
  | "Backlog";

// Especificação 3.0 §1.4 item 12 — select fixo com 4 opções
export type OperationalImpact = "Baixo" | "Médio" | "Alto" | "Crítico";

// Categorias: lista administrável por CRUD nas configurações (Especificação
// 3.0 §7.4 aba "Categorias"); união reflete as 10 opções base — novas
// categorias chegam como string livre validada contra o cadastro.
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

// Derivado no servidor a partir das partes binárias `attachments` do POST
// (multipart/form-data): Content-Disposition → fileName, Content-Type da
// parte → mimeType, tamanho da parte → sizeBytes. Nunca declarado no
// payload; referência para leitura futura (ex.: painel administrativo).
export interface AttachmentMetadata {
  fileName: string;      // nome original do arquivo — máx. 255
  mimeType: string;      // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number;     // máximo 10 * 1024 * 1024 (10MB)
}

// Limite de caracteres (tabela §4): restrição espelhada entre UI (`maxLength`
// + contador visual) e backend/banco. Violação → 400 com o campo indicado.
export interface RequesterBlock {
  fullName: string;            // obrigatório — máx. 150
  corporateEmail: string;      // obrigatório — e-mail corporativo, máx. 254 (RFC 5321)
  area: string;                // obrigatório — máx. 100
  department?: string;         // opcional (padrão; Admin pode tornar obrigatório) — máx. 100
                               // renderização híbrida: <Select> se houver departamentos
                               // cadastrados; texto livre caso contrário (§1.1)
  manager: string;             // obrigatório — gestor responsável, máx. 150
  additionalContact?: string;  // opcional — telefone, ramal ou e-mail secundário, máx. 100
}

// D-01 e D-02 resolvidas pela Especificação 3.0 §3: dois campos separados
// (`justification` + `expectedResult`) e `problem` obrigatório. D-05:
// `requestType` existe ao lado de `category` como entidades distintas.
export interface DemandBlock {
  title: string;               // obrigatório — título resumido, máx. 150
  requestType: string;         // obrigatório — Tipo de Solicitação (modalidade macro,
                               // ex.: Automação, Manutenção, Nova Demanda), máx. 80
  category: RequestCategory;   // obrigatório — Categoria da Demanda (select funcional), máx. 80
  processName: string;         // obrigatório — nome formal do processo atual, máx. 150
  description: string;         // obrigatório — Descrição da Necessidade, máx. 4.000
  problem: string;             // obrigatório — Problema ou Oportunidade Identificada, máx. 4.000
  expectedResult: string;      // obrigatório — Resultado Esperado, máx. 4.000
  justification: string;       // obrigatório — Justificativa da Solicitação, máx. 4.000
}

// Especificação 3.0 §1.4 — Bloco 3 completo: os 14 campos operacionais são
// obrigatórios (D-03: protótipo condensado descartado).
export interface OperationalBlock {
  processDescription: string;            // 1 — descrição resumida do processo atual, máx. 4.000
  processSteps: string;                  // 2 — principais etapas em tópicos/passo a passo, máx. 4.000
  systemsUsed: string;                   // 3 — softwares, ERPs, planilhas envolvidos, máx. 255
  executionFrequency: string;            // 4 — Diária, Semanal, Mensal, Por Demanda etc., máx. 50
  volumetry: string;                     // 5 — ex.: "500 transações/mês", máx. 100
  peopleInvolved: number;                // 6 — headcount alocado (INTEGER > 0)
  averageExecutionTime: string;          // 7 — tempo médio por ciclo, ex.: "15 minutos", máx. 60
  monthlyEffortHours: number;            // 8 — esforço mensal estimado em horas (DECIMAL(10,2))
  hasManualControls: YesNoDetail;        // 9 — controles manuais: false ou texto do
                                         //      detalhamento (obrigatório junto do "Sim")
  mainRisks: string;                     // 10 — riscos de erro/compliance/operacionais, máx. 2.000
  clientImpact: string;                  // 11 — reflexo no cliente interno/externo, máx. 2.000
  operationalImpact: OperationalImpact;  // 12 — Baixo/Médio/Alto/Crítico
  desiredDeadline: string;               // 13 — prazo desejado, data ISO "yyyy-mm-dd"
  perceivedCriticality: RequestPriority; // 14 — criticidade percebida pelo solicitante
}

// Resposta "Sim/Não (+ detalhamento)" das especificações (Espec 3.0 §1.4
// item 9 e §1.5): o detalhamento É a resposta positiva — dizer "Sim" sem
// escrever o detalhe é estruturalmente impossível.
//   false          → "Não" (sem observação)
//   string         → "Sim" + detalhamento obrigatório, trim não-vazio, máx. 1.000
export type YesNoDetail = false | string;

// Especificação 3.0 §1.5 — Bloco 4 integralmente opcional (D-04); a UI deve
// sinalizar que o preenchimento é facultativo.
export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail;      // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail;     // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail;   // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string;              // observações adicionais, máx. 2.000
}

// Até 3 opções declarativas de data/hora para mapeamento — herança do
// protótipo (ausente da Espec 3.0); permanece opcional por decisão de produto
export type SchedulePreferences = string[]; // ISO "yyyy-mm-ddThh:mm" — max 3
```

---

## 1. POST /requests — Cadastrar solicitação (Formulário de Demanda)

Público (sem autenticação — RN-001). Valida os campos e os limites de
caracteres da tabela §4, gera o **protocolo** — identificador único de
rastreio não enumerável, derivado do ID interno via FPE/Feistel
(ex.: `MAAT-8K3P-9X2M` — Especificação 3.0 §5.2), registra data/hora de
abertura e define status inicial `"Solicitação enviada"`.

**Body** — `multipart/form-data`; uma parte `payload` (texto) + partes
binárias repetidas `attachments` (0 a 5):

```ts
// Parte `payload` — campo texto cujo valor é o JSON.stringify de:
export interface CreateRequestPayload {
  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
  schedulePreferences?: SchedulePreferences; // até 3 horários
}

// Partes `attachments` — cada parte é um anexo: PDF, DOCX, XLSX, PNG ou
// JPG, até 10MB por arquivo. Os metadados (fileName, mimeType, sizeBytes)
// são derivados no servidor da própria parte — nunca declarados no payload.
```

**Nota de implementação (Express/multer):**

- `upload.fields([{ name: "payload", maxCount: 1 }, { name: "attachments", maxCount: 5 }])`
  — `req.body.payload` chega como string → `JSON.parse` (o Content-Type da
  parte é ignorado pelo parser de campos de texto);
- `limits.fileSize: 10MB` e `limits.files: 5` materializam os limites do contrato;
- `limits.fieldSize` explícito na config (default 1MB já comporta o JSON de ~40KB);
- whitelist de formatos via `fileFilter` (PDF/DOCX/XLSX/PNG/JPG);
- erros do multer (`LIMIT_FILE_SIZE`, `LIMIT_FILE_COUNT`, `LIMIT_UNEXPECTED_FILE`)
  mapeiam para o envelope `400` deste contrato; `originalname` pode chegar com
  encoding quebrado em nomes não-ASCII — normalização é decisão de implementação.

**Response 201** — `CreateRequestResponse`:

```ts
export interface CreateRequestResponse {
  protocol: string;        // "MAAT-8K3P-9X2M" — protocolo único de rastreio,
                           // não enumerável (FPE/Feistel sobre o ID interno —
                           // Especificação 3.0 §5.2)
  status: RequestStatus;   // "Solicitação enviada"
  createdAt: string;       // ISO datetime
}
```

**Exemplo real** — envio do formulário com um anexo:

```http
POST /requests HTTP/1.1
Content-Type: multipart/form-data; boundary=----MAATFormBoundary

------MAATFormBoundary
Content-Disposition: form-data; name="payload"

{
  "requester": {
    "fullName": "Maria Oliveira",
    "corporateEmail": "maria.oliveira@neo.com.br",
    "area": "Recursos Humanos",
    "department": "Folha de Pagamento",
    "manager": "João Santos",
    "additionalContact": "(11) 99999-0000"
  },
  "demand": {
    "title": "Automatizar conferência de diárias",
    "requestType": "Automação",
    "category": "Automação",
    "processName": "Pagamento de diárias",
    "description": "A conferência das diárias é feita manualmente em planilha, campo a campo, antes de cada pagamento.",
    "problem": "Conferência manual e demorada, sujeita a erros de digitação que geram retrabalho no pagamento.",
    "expectedResult": "Reduzir o tempo de conferência em 80% e eliminar erros de digitação no pagamento das diárias.",
    "justification": "O processo consome cerca de 60 horas/mês da equipe e gerou 12 pagamentos incorretos no último semestre."
  },
  "operational": {
    "processDescription": "RH recebe planilha de diárias por e-mail, confere campo a campo contra os comprovantes e lança no sistema.",
    "processSteps": "1. Receber planilha\n2. Conferir valores\n3. Lançar no sistema\n4. Enviar para aprovação",
    "systemsUsed": "Excel, Portal RH, SAP",
    "executionFrequency": "Mensal",
    "volumetry": "500 transações/mês",
    "peopleInvolved": 3,
    "averageExecutionTime": "15 minutos",
    "monthlyEffortHours": 60,
    "hasManualControls": "Conferência dupla assinada pelo gestor.",
    "mainRisks": "Erro de digitação em valores, pagamento duplicado e descumprimento do prazo de folha.",
    "clientImpact": "Atrasos no reembolso dos colaboradores e retrabalho para o RH.",
    "operationalImpact": "Alto",
    "desiredDeadline": "2026-09-30",
    "perceivedCriticality": "Alta"
  },
  "complementary": {
    "hasProcessDocumentation": "Fluxo desenhado no Visio (link interno).",
    "hasSimilarSolution": false,
    "dependsOnOtherAreas": "Financeiro aprova os lançamentos.",
    "handlesRestrictedInfo": "Contém dados salariais — sigilo.",
    "additionalNotes": "Planilha modelo anexa para referência."
  },
  "schedulePreferences": [
    "2026-09-02T08:00",
    "2026-09-02T10:00",
    "2026-09-03T14:00"
  ]
}
------MAATFormBoundary
Content-Disposition: form-data; name="attachments"; filename="fluxo-atual.pdf"
Content-Type: application/pdf

<binário — 820.000 bytes>
------MAATFormBoundary--
```

**Response** — `201 Created`:

```json
HTTP/1.1 201 Created

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Solicitação enviada",
  "createdAt": "2026-08-25T14:03:11.000Z"
}
```

**Exemplo de erro** — campo obrigatório ausente:

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos obrigatórios ausentes: demand.expectedResult, operational.volumetry"
}
```

**Erros:**

| Status | Quando |
|---|---|
| 400 | Bloco/campo obrigatório ausente ou inválido (`message` indica os campos) |
| 400 | Limite de caracteres excedido em qualquer campo limitado (espelhado UI/banco — Especificação 3.0 §4) |
| 400 | Resposta Sim/Não com detalhamento obrigatório ausente ou vazio (`string` vazia/só espaços nos Blocos 3 e 4) |
| 400 | `schedulePreferences` com mais de 3 opções |
| 400 | Parte `payload` ausente ou com JSON inválido |
| 400 | Anexo (parte `attachments`) > 10MB ou formato fora de PDF/DOCX/XLSX/PNG/JPG |
| 400 | Mais de 5 partes `attachments` |

---

## 2. GET /requests — Listar solicitações (Acompanhar Solicitações)

Público. Alimenta a tabela da página de acompanhamento. Paginação server-side.
Consulta sem resultados retorna `200` com `data: []` (estado vazio da tabela).

O acesso público exige `email` (D-07 / Especificação 3.0 §5.1 — a busca é
exclusivamente por e-mail OU código único de rastreio): listagem sem `email`
não existe neste contrato e responde `400`.

**Query params** — `ListRequestsQuery`:

```ts
export interface ListRequestsQuery {
  email: string;      // obrigatório — e-mail corporativo do solicitante
                      // (ProtocolSearchCard). Match exato após trim +
                      // case-insensitive; ausente ou malformado → 400.
                      // Regra incondicional: a fila completa do analista
                      // (RF03/RF11, RN-004) será contrato próprio, sem
                      // reuso deste endpoint.
  search?: string;    // termo da busca do header — match parcial em
                      // processName, requesterName ou corporateEmail.
                      // Protocolo não é buscável aqui: consulta direta pelo
                      // código completo vai para GET /requests/:protocol.
                      // Semântica da busca do header pendente de decisão;
                      // revisar combinação com email quando resolvida.
  status?: RequestStatus;
  page?: number;      // default 1
  pageSize?: number;  // default 10 — sem teto fixado neste contrato; teto
                      // máximo é decisão de implementação do backend
                      // (middleware/validação)
}
```

**Response 200** — `PaginatedResponse<RequestSummary>`:

```ts
// Item da tabela de acompanhamento (colunas: Protocolo, Data, Processo,
// Prioridade, Status, Responsável, Solicitante)
export interface RequestSummary {
  protocol: string;                 // "MAAT-8K3P-9X2M" — a UI renderiza o
                                    // prefixo "#" e apresenta como link
  createdAt: string;                // ISO datetime — coluna Data
  processName: string;              // coluna Processo
  priority: RequestPriority | null; // null até a triagem priorizar
  status: RequestStatus;
  assignee: string | null;          // null até a atribuição ou quando oculto por configuração
  requesterName: string;            // coluna Solicitante
}

// Envelope de paginação server-side
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

**Exemplos:**

```text
GET /requests?email=maria.oliveira@neo.com.br
GET /requests?email=maria.oliveira@neo.com.br&page=2&pageSize=10
GET /requests?email=maria.oliveira@neo.com.br&search=diarias&status=Em%20triagem
```

**Exemplo real** — consulta por e-mail (`page=1`, `pageSize=2`):

```http
GET /requests?email=maria.oliveira@neo.com.br&page=1&pageSize=2 HTTP/1.1
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "data": [
    {
      "protocol": "MAAT-8K3P-9X2M",
      "createdAt": "2026-08-25T14:03:11.000Z",
      "processName": "Pagamento de diárias",
      "priority": null,
      "status": "Em triagem",
      "assignee": null,
      "requesterName": "Maria Oliveira"
    },
    {
      "protocol": "MAAT-6N2W-8VBM",
      "createdAt": "2026-08-10T09:41:20.000Z",
      "processName": "Fechamento mensal de ponto",
      "priority": "Alta",
      "status": "Concluído",
      "assignee": "Fernando Alves",
      "requesterName": "Maria Oliveira"
    }
  ],
  "page": 1,
  "pageSize": 2,
  "total": 5,
  "totalPages": 3
}
```

Consulta sem resultado (`data: []`):

```json
HTTP/1.1 200 OK

{
  "data": [],
  "page": 1,
  "pageSize": 10,
  "total": 0,
  "totalPages": 0
}
```

Consulta sem `email` (obrigatório no acesso público):

```http
GET /requests HTTP/1.1
```

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Parâmetro obrigatório ausente: email"
}
```

**Erros:**

| Status | Quando |
|---|---|
| 400 | `email` ausente (obrigatório no acesso público — D-07/§5.1) |
| 400 | `email` malformado (formato inválido) |
| 400 | `page`/`pageSize` não numéricos ou `status` fora da matriz |

---

## 3. GET /requests/:protocol — Detalhe da solicitação (`/acompanhar/[protocolo]`)

Público (RN-005 — retorna apenas campos públicos; nunca comentários internos,
notas dos 10 critérios ou scores nem log de auditoria — D-06 da Especificação
3.0 §9.1 restringe o log ao painel administrativo, `GET /audit/:protocol`).

`:protocol` recebe o **protocolo** único de rastreio retornado na abertura —
com a geração via FPE/Feistel ele já é não enumerável, o que elimina o risco
de varredura sequencial (IDOR) apontado na D-07 da Especificação 3.0 §5.1.

O painel é retornado diretamente pelo protocolo informado, sem verificação
por e-mail — o código funciona como segredo de portador do solicitante
(Opção B da Especificação 3.0 §5.1). Endpoint sem query params.

**Response 200** — `RequestDetail` (apenas campos públicos):

```ts
export interface RequestDetail {
  protocol: string;             // "MAAT-8K3P-9X2M" — protocolo único de rastreio
                                // (FPE/Feistel — Especificação 3.0 §5.2)
  demandTitle: string;          // título resumido / nome da demanda
  processName: string;
  status: RequestStatus;        // status público atual
  assigneeName: string | null;  // responsável técnico — null quando não atribuído
                                // ou oculto pelo toggle de visibilidade do responsável
                                // (configurações administrativas — Especificação 3.0 §7.4)
  openedAt: string;             // data de abertura — ISO datetime
  estimatedCompletion: string | null; // previsão de conclusão — ISO "yyyy-mm-dd"
                                      // (fonte: protótipo/issue front — sem base direta na Espec 3.0)
  mappingDate: string | null;   // derivado — parte-data de meeting.scheduledFor quando
                                // houver reunião (conversão no fuso America/Sao_Paulo);
                                // sem reunião, previsão informada pelo analista ou null
                                // ("Previsão ou Data Confirmada" — consulta-de-solicitacao.md)
  meeting: {                    // reunião de alinhamento (card da tela)
    scheduledFor: string;       // ISO datetime
    link: string | null;        // null → botão "Entrar na reunião" permanece visual
  } | null;
  pendingIssues: string[];      // pendências destinadas ao solicitante (RF09/RF04;
                                // fluxo consulta-de-solicitacao.md). Provisório:
                                // issue futura de resposta exigirá shape com
                                // identidade por item ({ id, question, answer });
                                // a escrita tende a usar o par protocolo+email
                                // como identidade do solicitante
  nextStep: string;             // instrução orientativa — sempre presente no painel
                                // (fonte: docs/produto/fluxos/consulta-de-solicitacao.md
                                // — ex.: "Aguarde o contato do analista")
  lastTechnicalMessage: string | null; // última mensagem do responsável técnico
                                // (fonte: protótipo/issue front — sem base direta na Espec 3.0)
  lastUpdate: string;           // ISO datetime da última movimentação
  conclusion: {                 // conclusão da análise, quando encerrada
    result: TriageResult;       // veredito formal da triagem ("Resultado da Triagem")
    justification: string;      // texto consolidado conclusaoAnalise — máx. 4.000 (§4)
  } | null;
}
```

**Exemplos:**

```text
GET /requests/MAAT-8K3P-9X2M
```

**Exemplo real** — consulta pública pelo protocolo:

```http
GET /requests/MAAT-8K3P-9X2M HTTP/1.1
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "demandTitle": "Automatizar conferência de diárias",
  "processName": "Pagamento de diárias",
  "status": "Em triagem",
  "assigneeName": "Fernando Alves",
  "openedAt": "2026-08-25T14:03:11.000Z",
  "estimatedCompletion": "2026-10-18",
  "mappingDate": "2026-10-15",
  "meeting": {
    "scheduledFor": "2026-10-15T10:30:00.000Z",
    "link": null
  },
  "pendingIssues": [],
  "nextStep": "Aguarde o contato do analista",
  "lastTechnicalMessage": "Sua solicitação está em análise. Assim que houver uma atualização, entraremos em contato.",
  "lastUpdate": "2026-08-26T10:12:40.000Z",
  "conclusion": null
}
```

**Exemplo de erro** — protocolo inexistente:

```json
HTTP/1.1 404 Not Found

{
  "status": "error",
  "statusCode": 404,
  "message": "Solicitação não encontrada"
}
```

**Erros:**

| Status | Quando |
|---|---|
| 404 | Protocolo inexistente |

---

## Observações do contrato

- Valores de `status`, `priority`, `category` etc. são strings PT-BR (domínio
  de produto); chaves/estruturas em inglês (CONTRIBUTING, seção 1).
- Limites de caracteres (Especificação 3.0 §4) são espelhados entre UI
  (`maxLength` + contador regressivo) e backend/banco; payload fora dos limites
  → `400` com o campo indicado — sem truncamento silencioso.
- Departamento: renderização híbrida (`<Select>` quando houver cadastro
  administrativo; texto livre caso contrário) e obrigatoriedade parametrizável,
  padrão opcional (§1.1 / FAQ).
- Tipo de Solicitação e Categoria são entidades distintas e ambas obrigatórias
  (D-05 / FAQ); categorias são administráveis via CRUD nas configurações.
- A matriz de `RequestStatus` deste contrato contém os 17 status visíveis ao
  solicitante (`docs/produto/fluxos/README.md`) e é a única que aparece no
  campo `status`. O vocabulário interno de triagem (RF04 / Especificação 3.0
  §7.3) trafega apenas como veredito em `conclusion.result`, tipado por
  `TriageResult` — sem tradução entre matrizes.
- Reunião de mapeamento: `meeting.scheduledFor` é a única fonte persistida do
  evento (Especificação 3.0 §6.1); `mappingDate` é computado na leitura — os
  dois campos nunca divergem.
- Campos do painel `RequestDetail` com lastro apenas no protótipo/issues do
  front (`estimatedCompletion`, `lastTechnicalMessage`) permanecem por decisão
  de produto; `nextStep` tem base no fluxo oficial de consulta; detalhamentos
  sem limite definido na §4 estão marcados no próprio tipo (anexos são
  tratados como partes do POST — seção 1).
- Respostas "Sim/Não (+ detalhamento)" (item 9 do Bloco 3 e questionário do
  Bloco 4) trafegam como `false | string` — o detalhe é a própria resposta
  positiva e não existe "Sim" sem texto; `string` vazia → `400`. Na
  persistência, o backend deriva a flag booleana + coluna de detalhe da tabela
  §4 (1.000 no Bloco 4; análogo aplicado ao item 9).
- Anexos: trafegam como partes binárias `attachments` do POST
  (multipart/form-data — seção 1); metadados derivados no servidor; 0 a 5
  arquivos, 10MB e formatos PDF/DOCX/XLSX/PNG/JPG por arquivo. Leitura/download
  de anexos em endpoint futuro; as colunas singulares de anexo da tabela §4
  (`anexoNomeArquivo`/`anexoStorageUrl`) são decisão de modelagem do backend.
- Detecção de demandas semelhantes durante a digitação (banner orientativo não
  impeditivo — Especificação 3.0 §1.3/§10) ainda não possui endpoint neste
  contrato; detalhamento em issue futura.
- Consulta pública acontece por e-mail (listagem em `GET /requests`, cuja
  exigência de `email` é regra incondicional do endpoint) ou por código direto
  (detalhe em `GET /requests/:protocol`, sem verificação por e-mail); como o
  protocolo nasce do FPE/Feistel, ele é não enumerável — D-07 da Especificação
  3.0 atendida sem rota separada. A fila completa do analista (RF03/RF11) será
  contrato próprio protegido por autenticação (RN-004), com `email` opcional —
  sem reuso deste endpoint.
- Fontes mais antigas (`docs/produto/fluxos/`) ainda descrevem o protocolo no
  formato sequencial `NEO-{ANO}-{SEQUENCIAL}` e a validação do par
  protocolo+email como mecanismo de acesso ao painel — pendente de atualização
  lá; neste contrato prevalece a geração via FPE/Feistel (§5.2) e o acesso ao
  detalhe apenas pelo código (Opção B, §5.1). O par protocolo+email permanece
  como alternativa de hardening pré-produção (divergências D-07) e como
  identidade provável do solicitante no futuro endpoint de resposta a
  pendências.
- Pendências do solicitante (`pendingIssues`) e resposta a pendências serão
  detalhados em issue futura; o campo já nasce no contrato.
