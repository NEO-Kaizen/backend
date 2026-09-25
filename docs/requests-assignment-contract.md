# Contrato de API — Responsável Técnico da Solicitação

Contrato Frontend ↔ Backend para listar os responsáveis técnicos elegíveis e
definir/substituir/remover o responsável de uma solicitação (issue #50).

- Fonte de verdade: Issue #50 e RN-010 (gatilho de status na triagem de
  elegíveis).
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

Um responsável é **elegível** quando, simultaneamente:

1. `details_professional.status = 'active'` (está na rotação — um analista em
   licença fica `inactive` mas mantém o login);
2. `users.is_active = true` (conta ativa);
3. o perfil do usuário é `analista` ou `gestor` (`ASSIGNABLE_PROFILES`).

`requests.professional_id` referencia `details_professional.professional_id`
com `ON DELETE SET NULL` — solicitações antigas mantêm o vínculo mesmo se o
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

## 1. GET /requests/assignees — Responsáveis elegíveis

Protegido por autenticação (cookie de sessão) e restrito aos perfis
`Analista`, `Gestor` e `Administrador`. A leitura é mais ampla que a escrita
porque a fila (`GET /queue`) usa a mesma lista para filtrar por responsável.

**Resposta 200** — `AssigneeSummary[]`, ordenada por `name` (asc). Apenas
elegíveis (ver critérios acima).

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
| 403    | Perfil `Solicitante`                    |

---

## 2. PATCH /requests/:protocol/assignee — Definir / substituir / remover responsável

Protegido por autenticação. **issue #124**: liberado a `Administrador` **ou**
`ANALYST_ASSIGNEE` da solicitação (responsável da triagem **ou** designado do
mapeamento — guard `canAssignRequest` no service). `Gestor` não atribui;
demais perfis → `403`. (Antes da v4 a atribuição era restrita ao perfil
`Administrador` — critério de aceite da issue #50.)

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

| Código | Mensagem                                                                                                          | Situação                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 400    | `Campos inválidos: professionalId — ...`                                                                          | Body ausente/inválido (não é UUID nem `null`)                                        |
| 400    | `Responsável não encontrado.`                                                                                     | UUID não existe em `details_professional`                                            |
| 400    | `Responsável inativo.`                                                                                            | `details_professional.status = 'inactive'` **ou** `users.is_active = false`          |
| 400    | `Perfil do responsável não permite atribuição.`                                                                   | Usuário vinculado não é `analista`/`gestor`                                          |
| 401    | `Token inválido ou expirado`                                                                                      | Sem sessão                                                                           |
| 403    | `Ação restrita ao Administrador ou ao Analista responsável pela demanda.` (`code: INSUFFICIENT_ROLE_PERMISSIONS`) | Perfil sem permissão: não é `Administrador` nem `ANALYST_ASSIGNEE` (inclui `Gestor`) |
| 404    | `Solicitação não encontrada`                                                                                      | Protocolo inexistente                                                                |

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
