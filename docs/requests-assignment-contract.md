# Regras de negócio — Responsável Técnico da Solicitação

Regras de negócio para listar os responsáveis técnicos elegíveis e
definir/substituir/remover o responsável de uma solicitação (issue #50).

- Fonte de verdade: Issue #50 e RN-010 (gatilho de status na triagem de
  elegíveis).
- Fonte da verdade das rotas, payloads e respostas: OpenAPI em
  `src/docs/paths/requests.ts` e `src/docs/schemas/`.
- Este documento descreve regras de negócio e exemplos; não é fonte da verdade
  do contrato HTTP.
- Referências: `src/modules/requests/*` (router/controller/service/repository),
  `src/modules/DTOs/requests/RequestResponse.dto.ts` (`AssigneeSummary`,
  `AssignRequestResponse`), `src/shared/audit/auditCatalog.ts` (entidade
  `request`), migration `20260917013250_rename_professionals_to_details_professional.js`.
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Modelo

O responsável técnico é um registro de `details_professional`, vinculado 1:1 a
um usuário do sistema (`details_professional.user_id → users.user_id`, `UNIQUE`).
Nome e e-mail vêm sempre de `users`; `details_professional` guarda apenas os
dados de rotação (`status`, `capacity`, `job_title`, `specialties`, ...).

O Responsável é atribuível quando a extensão de profissional está ativa,
a conta e o Perfil estão ativos, a flag de Atribuibilidade da etapa está ligada
e o Perfil tem as chaves exigidas pelo predicado dessa etapa. A API revalida
essas condições no servidor em cada atribuição e reatribuição.

Para designação interna, o ator precisa de `request:assign` e Custódia sobre a
solicitação; o alvo inválido (incluindo usuário ou Perfil inativo) responde
`400` com o código estável `assignee_not_assignable`. A reatribuição aplica as
mesmas validações. Quem criou a solicitação não pode ser o Responsável dela:
a recusa é `400 assignee_is_requester` na triagem, no mapeamento e na rota
legada; `null` (remover) continua permitido, e solicitações anônimas ou legadas
sem `requests.requester_user_id` não são afetadas. Quando o ator não pode ler a
linha após a mutação, a resposta é um acknowledgement
`{ protocol, updated: true }`, sem conteúdo interno.

`requests.professional_id` referencia `details_professional.professional_id` com `ON DELETE SET NULL` — solicitações antigas mantêm o vínculo mesmo se o
profissional for desativado.

---

## Tipos compartilhados

```ts
export interface AssigneeSummary {
  id: string; // details_professional.professional_id (UUID)
  name: string; // users.full_name
  email: string; // users.email
  jobTitle: string | null; // details_professional.job_title
  capacity: number; // details_professional.capacity
}

export interface AssignRequestPayload {
  professionalId: string | null; // UUID do responsável; null remove o responsável
}

export interface AssignRequestResponse {
  protocol: string;
  assignee: { id: string; name: string; email: string } | null;
  status: RequestStatus; // status após a operação (muda quando a RN-010 dispara)
}
```

---

## 1. GET /requests/assignees — Responsáveis atribuíveis

Protegido por autenticação (cookie de sessão) e pela permissão
`assignee_directory:read`. A leitura é mais ampla que a escrita
porque a fila (`GET /queue`) usa a mesma lista para filtrar por responsável.

**Resposta 200** — `AssigneeSummary[]`, ordenada por `name` (asc). Apenas
Responsáveis atribuíveis conforme flag e predicado de cada etapa.

```json
[
  {
    "id": "650e8400-e29b-41d4-a716-446655440003",
    "name": "Bruno Analista",
    "email": "bruno.analista@email.com",
    "jobTitle": "Mapeador de Processos",
    "capacity": 6
  }
]
```

**Erros**

| Código | Situação                                |
| ------ | --------------------------------------- |
| 401    | Sem cookie de sessão ou sessão inválida |
| 403    | Ator sem `assignee_directory:read`      |

---

## 2. PATCH /requests/:protocol/assignee — Definir / substituir / remover responsável

Protegido por autenticação e `request:assign`. O serviço valida a Custódia
da solicitação e a Atribuibilidade do alvo. Alvo inválido responde 400 com
code `assignee_not_assignable`; criador da solicitação como responsável
responde 400 com code `assignee_is_requester`. A rota interna de designação
segue as mesmas validações. Seu resultado detalhado só é devolvido quando o ator
também pode ler a solicitação; caso contrário, a resposta contém
`{ protocol, updated: true }`.

**Body** — `AssignRequestPayload`

```json
{ "professionalId": "650e8400-e29b-41d4-a716-446655440003" }
```

```json
{ "professionalId": null }
```

**Resposta 200** — `AssignRequestResponse`

```json
{
  "protocol": "MAAT-2R7Q-4M1C",
  "assignee": {
    "id": "650e8400-e29b-41d4-a716-446655440003",
    "name": "Bruno Analista",
    "email": "bruno.analista@email.com"
  },
  "status": "Aguardando mapeamento"
}
```

**Erros**

| Código | Situação                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| 400    | Body inválido, alvo inválido (`assignee_not_assignable`) ou criador como responsável (`assignee_is_requester`) |
| 401    | Sem sessão ou sessão inválida                                                                                  |
| 403    | Ator sem `request:assign`                                                                                      |
| 404    | Solicitação inexistente ou fora da Custódia do ator                                                            |

### Semântica

- **Definir**: `professional_id` era `null` e passa a ter valor.
- **Substituir**: `professional_id` já tinha valor e recebe outro. Não há
  restrição — a rastreabilidade fica na auditoria.
- **Remover**: `professionalId: null`. Não reverte o status alterado pela
  RN-010.
- **Liberação automática**: concluir a triagem (`POST /triage`) ou concluir de
  fato o mapeamento (`PUT mapping` com `completeMapping:true` e
  `targetStatus !== 6`) remove o responsável vinculado na mesma transação
  (`requests.professional_id` / `requests.mapping_professional_id = null`),
  gravando `request.unassign`/`mapping.assign(null)` com
  `change_origin = 'system'`. A solicitação volta a ficar órfã — apenas
  `Administrador` consegue reatribuir (não há claim órfão). Agendar o
  mapeamento (`targetStatus === 6`) **mantém** o designado.
- `requests.updated_by` recebe o e-mail do executor (Administrador ou
  analyst-assignee autorizado); `updated_at` é atualizado.

### RN-010 — Gatilho de status na triagem de elegíveis

Ao **definir ou substituir** o responsável, se a solicitação estiver em
`Em triagem` **e** `requests.screening_result = 'elegivel'`, o status muda
automaticamente para `Aguardando mapeamento`. O novo status volta em
`AssignRequestResponse.status`.

A regra não dispara ao remover o responsável (`null`) nem quando a solicitação
está em qualquer outro status.

### Transação e auditoria

Atribuição, gatilho RN-010 e eventos de auditoria são gravados na **mesma
transação**: se qualquer etapa falhar, nada é aplicado.

Eventos em `audit_history` (`entity_type = 'request'`, `entity_id = protocolo`):

| `action_type`           | `previous_value` | `new_value`             | `note`     | `change_origin` |
| ----------------------- | ---------------- | ----------------------- | ---------- | --------------- |
| `request.assign`        | `null`           | UUID do responsável     | IP do ator | `admin`         |
| `request.reassign`      | UUID anterior    | UUID novo               | IP do ator | `admin`         |
| `request.unassign`      | UUID anterior    | `null`                  | IP do ator | `admin`         |
| `request.status_change` | `Em triagem`     | `Aguardando mapeamento` | `RN-010`   | `system`        |

`user_id` é sempre o executor autenticado da operação, inclusive no
`status_change` disparado pela regra.

---

## Efeito nas demais consultas

- `GET /queue`: `assignee` (nome) e a lista `assignees` passam a vir de `users`
  via `details_professional`. O filtro `assigneeId` continua recebendo o UUID
  de `details_professional.professional_id`.
- `GET /requests/:protocol` (pública): `assigneeName` vem de `users.full_name`.
- `GET /requests/:protocol/internal`: `assignee.name`/`assignee.email` vêm de
  `users`.
- `GET /requests?email=`: `assignee` vem de `users.full_name`.
