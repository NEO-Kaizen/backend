# Contrato de API — Consulta Interna de Solicitação (Painel Administrativo)

Contrato do endpoint `GET /requests/:protocol/internal`, autenticado, usado
pela tela de especificação da solicitação (`/(admin)/fila/[protocolo]`) do
painel administrativo (analistas, gestores e administradores). Issue #48.

- Fonte de verdade do contrato de resposta: `internal-request-contract.md`
  (compartilhado pelo time de frontend).
- Referência de produto: `funcionalidades-especificacao.md` §"Consultar
  solicitação por protocolo (para adms)".
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

## Diferença em relação à consulta pública

Este contrato é **explicitamente diferente** do contrato público
(`docs/solicitations-api-requests-0_4.md` §3, `RequestDetail`, issue #34),
usado na tela de acompanhamento do solicitante (`/acompanhar/[protocolo]`):

|                         | Consulta interna (`RequestInternalDetailDTO`, este contrato)                               | Consulta pública (`RequestDetail`)                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Rota                    | `GET /requests/:protocol/internal`                                                         | `GET /requests/:protocol`                                                                              |
| Autenticação            | **Obrigatória** (cookie de sessão válido)                                                  | Pública, sem autenticação                                                                              |
| Blocos do cadastro      | Retorna os **4 blocos completos** (`requester`, `demand`, `operational`, `complementary`)  | Não expõe os blocos brutos — apenas campos derivados para exibição (`demandTitle`, `processName` etc.) |
| Campos internos         | Retorna `internalObservations`                                                             | **Nunca** retorna comentários internos, notas dos critérios ou scores (RN-005)                         |
| Score de priorização    | Retorna `prioritization.score`/`maxScore`/`label` (10–50, de `prioritization_evaluations`) | Não existe no contrato público                                                                         |
| Anexos                  | Retorna `attachments[]` (metadados)                                                        | Não expõe anexos                                                                                       |
| Preferências de horário | Retorna `schedulePreferences[]`                                                            | Não expõe                                                                                              |
| Protocolo inexistente   | `404`                                                                                      | `404`                                                                                                  |

Como o painel administrativo dá acesso a dados sensíveis (justificativas
internas, dados do solicitante, anexos), a rota exige sessão autenticada —
diferente da consulta pública, cujo protocolo funciona como segredo de
portador.

## GET /requests/:protocol/internal

**Autenticação:** obrigatória — cookie de sessão (`session_id`) válido,
enviado automaticamente após `POST /auth/login`. Sem cookie ou com token
inválido/expirado → `401`.

**Autorização:** `Administrador` e `Gestor` (read-only) veem qualquer
solicitação; `Analista` apenas as atribuídas por triagem (`assignee`) ou
mapeamento (`mappingAssignee`) — escopo #102. Fora do escopo → `403`.

**Path param:** `protocol` — o código de rastreio da solicitação
(URL-encoded), ex.: `MAAT-8K3P-9X2M`.

### Response 200 — `RequestInternalDetailDTO`

```ts
export type YesNoDetail = false | string; // false = "Não"; string = "Sim" + detalhe

export interface RequesterBlock {
  fullName: string;
  corporateEmail: string;
  area: string;
  department?: string; // chave ausente quando não cadastrado
  manager: string;
  additionalContact?: string; // chave ausente quando não cadastrado
}

export interface DemandBlock {
  title: string;
  requestType: string;
  category: string;
  processName: string;
  description: string;
  problem: string;
  expectedResult: string;
  justification: string;
}

export interface OperationalBlock {
  processDescription: string;
  processSteps: string;
  systemsUsed: string;
  executionFrequency: string;
  volumetry: string;
  peopleInvolved: number;
  averageExecutionTime: string;
  monthlyEffortHours: number;
  hasManualControls: YesNoDetail;
  mainRisks: string;
  clientImpact: string;
  operationalImpact: string;
  desiredDeadline: string; // ISO "yyyy-mm-dd"
  perceivedCriticality: string;
}

export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail;
  hasSimilarSolution?: YesNoDetail;
  dependsOnOtherAreas?: YesNoDetail;
  handlesRestrictedInfo?: YesNoDetail;
  additionalNotes?: string;
}

export interface Assignee {
  id: string | null; // details_professional.user_id do responsável (id de users,
  // serializado como string) — comparação de permissão de edição do Mapeamento
  // (mappingAssigneeId === currentUser.id; contrato-mapeamento.md §9, issue #86)
  name: string;
  email: string | null;
}

export interface Prioritization {
  score: number | null; // 10–50 (RN-007/RN-008, issue #51); null até ser avaliado
  maxScore: 50; // escala normalizada fixa — fonte: prioritization_evaluations
  label: string | null; // classificação RN-008 (ex.: "Alta"); null sem avaliação
}

export interface Meeting {
  scheduledFor: string;
  link: string | null;
}

export interface CorrectionAlert {
  count: number;
  message: string;
}

export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  canDownload: boolean;
}

export interface RequestInternalDetailDTO {
  protocol: string;
  status: string;
  priority: string | null;
  prioritization: Prioritization;
  assignee: Assignee | null;
  correctionAlert: CorrectionAlert | null;

  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock; // chave ausente quando nenhum dos 5 campos foi respondido
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  meeting: Meeting | null;

  attachments: InternalAttachment[];
  openedAt: string; // ISO datetime UTC
  lastUpdate: string; // ISO datetime UTC
  internalObservations: string | null;
}
```

**Exemplo real:**

```http
GET /requests/MAAT-8K3P-9X2M/internal HTTP/1.1
Cookie: session_id=<jwt>
```

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Aguardando mapeamento",
  "priority": "Alta",
  "prioritization": { "score": null, "maxScore": 50, "label": null },
  "assignee": { "id": "104", "name": "João Analyst", "email": "joao.analyst@empresa.com" },
  "correctionAlert": null,
  "requester": {
    "fullName": "Maria Silva",
    "corporateEmail": "maria.silva@empresa.com",
    "area": "Financeiro",
    "department": "Contabilidade",
    "manager": "José Carlos",
    "additionalContact": "(11) 98765-4321"
  },
  "demand": {
    "title": "Automatizar conciliação bancária",
    "requestType": "Automação",
    "category": "Automação",
    "processName": "Conciliação bancária mensal",
    "description": "Processo manual com alta carga operacional hoje.",
    "problem": "Conciliação manual sujeita a erros e consumo de 40h/mês.",
    "expectedResult": "Conciliação automatizada com conferência eletrônica.",
    "justification": "O processo consome cerca de 40 horas/mês da equipe."
  },
  "operational": {
    "processDescription": "...",
    "processSteps": "...",
    "systemsUsed": "ERP, portal bancário, planilhas Excel",
    "executionFrequency": "Mensal",
    "volumetry": "~5.000 lançamentos por mês",
    "peopleInvolved": 3,
    "averageExecutionTime": "5 dias úteis",
    "monthlyEffortHours": 40,
    "hasManualControls": "Conferência dupla assinada pelo gestor.",
    "mainRisks": "...",
    "clientImpact": "...",
    "operationalImpact": "Alto",
    "desiredDeadline": "2026-09-30",
    "perceivedCriticality": "Alta"
  },
  "complementary": {
    "hasProcessDocumentation": "Fluxo desenhado no Visio (link interno).",
    "hasSimilarSolution": false,
    "dependsOnOtherAreas": "Financeiro aprova os lançamentos.",
    "handlesRestrictedInfo": "Contém dados financeiros sensíveis — sigilo.",
    "additionalNotes": "Planilha modelo anexa para referência."
  },
  "schedulePreferences": ["2026-09-02T08:00", "2026-09-02T10:00", "2026-09-03T14:00"],
  "mappingDate": null,
  "meeting": null,
  "attachments": [
    {
      "fileName": "fluxo_atual.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 412000,
      "downloadUrl": null,
      "canDownload": false
    }
  ],
  "openedAt": "2026-07-01T09:00:00.000Z",
  "lastUpdate": "2026-07-08T12:00:00.000Z",
  "internalObservations": null
}
```

**Erros:**

| Status | Quando                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------- |
| 401    | Sem cookie de sessão, ou token inválido/expirado                                               |
| 403    | Autenticado sem perfil interno (Solicitante) — acesso restrito a Analista/Gestor/Administrador |
| 404    | Protocolo inexistente                                                                          |

```json
HTTP/1.1 401 Unauthorized

{ "status": "error", "statusCode": 401, "message": "Token não fornecido" }
```

```json
HTTP/1.1 403 Forbidden

{ "status": "error", "statusCode": 403, "message": "Acesso restrito ao perfil Analista ou Gestor ou Administrador" }
```

```json
HTTP/1.1 404 Not Found

{ "status": "error", "statusCode": 404, "message": "Solicitação não encontrada" }
```

## Limitações conhecidas desta implementação

- **`403` implementado.** Acesso restrito aos perfis internos
  `Analista`, `Gestor` e `Administrador` (decisão P2). O perfil `Solicitante`
  autenticado recebe `403` e deve usar a consulta pública.
- **`meeting` e `mappingDate` sempre `null`.** Não existe tabela de reunião
  de mapeamento agendada no schema atual (`request_time_preferences` só
  guarda as preferências de horário do solicitante, não a reunião
  efetivamente marcada). Aguardando issue que modele isso.
- **`correctionAlert` sempre `null`.** Não há fonte de dados equivalente
  no schema atual.
- **`attachments[].downloadUrl` sempre `null` e `canDownload` sempre
  `false`.** Não existe endpoint de download de anexos implementado ainda —
  a rota nunca oferece um link que não funcione.
- **`prioritization.score`/`label`** vêm de `prioritization_evaluations`
  (escala 10–50, RN-007/RN-008), gravados pela issue #51 (`POST` de
  avaliação de priorização). Sem avaliação → `score: null` e `label: null`.
