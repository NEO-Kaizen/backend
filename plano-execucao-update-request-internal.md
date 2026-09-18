# Plano de Execução — PATCH /requests/:protocol/internal

Implementação da issue `issue-backend-update-request-internal.md` (Backend —
atualização interna da solicitação). Validação por **testes manuais** (sem
suíte automatizada).

## 0. Decisões aprovadas (fonte off the record — confirmadas com o time)

| #   | Decisão                     | Escolha                                                                                                                                                                                                         |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Método e URL                | `PATCH /requests/:protocol/internal` (rota já esboçada no router)                                                                                                                                               |
| 2   | Resposta de sucesso         | `200` com `RequestInternalDetailDTO` atualizado                                                                                                                                                                 |
| 3   | Erro de validação           | `422` com envelope padrão + campo `fields { chaveDaUI: mensagem }`                                                                                                                                              |
| 4   | `fullName`/`corporateEmail` | **Ignorados silenciosamente** (Zod `strip`)                                                                                                                                                                     |
| 5   | Autorização (issue #121)    | **Completa nesta entrega**: `Administrador`/`Gestor` editam qualquer; `Analista` só as atribuídas a ele (`requests.professional_id` = seu `details_professional.professional_id`)                               |
| 6   | Dedup do solicitante        | Atualizar o registro **compartilhado** em `requesters` (efeito colateral sobre outras solicitações do mesmo e-mail é aceito e documentado)                                                                      |
| 7   | `last_external_update_at`   | **Não** atualizar — só `updated_at`/`updated_by`                                                                                                                                                                |
| 8   | Auditoria                   | Um único evento `request.update`, `previousValue`/`newValue` = JSON dos blocos editáveis                                                                                                                        |
| 9   | Semântica do PATCH          | **Substituição completa** dos blocos editáveis: chave ausente = campo limpo (persistir `NULL`). Vale também para `complementary` omitido por inteiro — o frontend deve SEMPRE emitir o bloco com o estado atual |

## 1. Pré-requisitos

- [ ] Ambiente Docker de pé e populado: `npm run docker:db:setup` (ou fluxo local
      com `npm run migrate:latest && npm run seed:run`).
- [ ] Linha de base verde: `npm run typecheck && npm run lint && npm run format:check`.
- [ ] Branch de trabalho criada a partir de `main` (padrão do repo, ex.:
      `feat/patch-request-internal`).

## 2. Contrato finalizado (documentação)

> Documentar as escolhas da seção 0 no contrato para destravá-lo de "proposta".

- [ ] `contract-request-update.md`:
  - método/path confirmados como `PATCH /requests/:protocol/internal`;
  - resposta `200` com `RequestInternalDetailDTO`;
  - erro `422`: envelope `{ status: "error", statusCode: 422, message }` +
    `fields: { "demand.title": "…", "operational.hasManualControlsDetail": "…" }`
    (chaves no formato da UI);
  - `fullName`/`corporateEmail` ignorados;
  - autorização: perfis internos + regra da issue #121;
  - semântica: substituição completa (ausência = `NULL`);
  - removidas/invalidadas as "Questões em aberto" 1–5.
- [ ] `README.md`: registrar o endpoint na seção "Solicitações" (bloco à parte do
      GET interno), só após o código passar.

## 3. DTO do update

Arquivo: `src/modules/DTOs/requests/RequestRequests.dto.ts`

- [ ] Adicionar os tipos:
  ```ts
  export interface UpdateRequesterBlock {
    area: string;
    department?: string;
    manager: string;
    additionalContact?: string;
  }

  export interface UpdateInternalRequestPayload {
    requester: UpdateRequesterBlock; // sem fullName/corporateEmail
    demand: DemandBlock;
    operational: OperationalBlock;
    complementary?: ComplementaryBlock;
  }
  ```
- [ ] Blocos `DemandBlock`/`OperationalBlock`/`ComplementaryBlock` importados de
      `../../../shared/types/requests.ts` (fonte única — mesma do GET interno).

## 4. Validação (Zod) e mapeamento de chaves do 422

Arquivo: `src/modules/requests/requests.schema.ts`

- [ ] `updateRequesterSchema = requesterSchema.omit({ fullName: true, corporateEmail: true })`.
      O `z.object` do Zod faz `strip` por padrão → chaves extras (incluindo
      `fullName`/`corporateEmail`) são **descartadas sem erro**. Confirma Decisão 4.
- [ ] `desiredDeadline` hoje ou futura (regra nova, **somente no PATCH** — não
      alterar comportamento do POST):
  ```ts
  const operationalUpdateSchema = operationalSchema.extend({
    desiredDeadline: z.iso
      .date("Data inválida — use o formato AAAA-MM-DD.")
      .refine((value) => value >= todayYmd(), "O prazo desejado deve ser hoje ou uma data futura."),
  });
  ```
  (helper `todayYmd()` local em `America/Sao_Paulo`, alinhado a
  `src/shared/utils/date.ts`).
- [ ] `updateRequestSchema`:
  ```ts
  export const updateRequestPayloadSchema = z.object({
    requester: updateRequesterSchema,
    demand: demandSchema, // todos obrigatórios (contrato)
    operational: operationalUpdateSchema,
    complementary: complementarySchema.optional(), // opcional por inteiro
  });
  export type UpdateRequestPayload = z.infer<typeof updateRequestPayloadSchema>;
  ```
- [ ] Atenção já coberta pela base existente (apenas conferir): `peopleInvolved`
      `int` e `>= 1`; `monthlyEffortHours >= 0`; `hasManualControls` obrigatório e
      `YesNoDetail` (`false | string(min(1))`) já exige detalhe no "Sim";
      complementares: `has*` como `false | string | omitido`, com detalhe
      obrigatório quando "Sim" (via `yesNoDetailSchema`); `optionalString` já
      transforma `""` → `undefined` (coerente com a normalização da UI).

### Formatação do 422 com chaves da UI

Arquivo: `src/shared/validation/zodErrors.ts` (ou novo helper no módulo)

- [ ] Novo mapeador `formatZodFieldErrors(error): { message: string; fields: Record<string, string> }`.
      Reusa a lógica atual de `formatZodIssues` (agrupamento obrigatórios/inválidos)
      mas devolve um objeto `fields` indexado pela **chave da UI**.
- [ ] Mapa de tradução de path → chave da UI:
  ```ts
  const UI_FIELD_KEYS: Record<string, string> = {
    "operational.hasManualControls": "operational.hasManualControlsDetail",
    // quando mais campos divergirem do path natural, crescer aqui
  };
  // chave final = UI_FIELD_KEYS[path] ?? path
  ```

## 5. Erro de validação com `fields` no envelope

Arquivo: `src/shared/errors/AppError.ts` (ao lado) e `src/shared/middleware/errorHandler.ts`

- [ ] Nova classe (novo arquivo `src/shared/errors/ValidationError.ts`):
  ```ts
  export class ValidationError extends AppError {
    public readonly fields: Record<string, string>;
    constructor(fields: Record<string, string>, message: string) {
      super(message, 422);
      this.name = "ValidationError";
      this.fields = fields;
    }
  }
  ```
- [ ] `errorHandler`: quando `err` possuir a propriedade `fields`, incluí-la no
      corpo do envelope. Retrocompatível (campo opcional — endpoints existentes
      seguem iguais).

## 6. Repositório (persistência)

Arquivo: `src/modules/requests/requests.repository.ts`

- [ ] `findUpdateContextByProtocol(protocol)` — query dedicada (sem as subconsultas
      de anexos/preferências/avaliação do GET) retornando a linha crua: `request_id`,
      `requester_id`, `professional_id` + as colunas dos 4 blocos (para o
      `previousValue` da auditoria). Renomear/montar a partir do `findInternalRequestByProtocol`
      atual (que passa a poder delegar a ela).
- [ ] `findProfessionalByUserId(userId: number)` — `details_professional` onde
      `user_id = userId` → `professional_id` (1:1 com `users`). Para a regra #121.
- [ ] `updateRequestBlocks(trx, requestId, payload, updatedBy: string)`:
  - `UPDATE requests` com as colunas de `demand`, `operational` e
    `complementary` (conversão `YesNoDetail` → par flag/detail reusando o
    helper `yesNoDetail` já existente no arquivo; `additional_notes` →
    `payload.complementary?.additionalNotes ?? null`);
  - **substituição completa**: todo campo ausente no payload vira `NULL`
    (flag `null`/detail `null`), inclusive `has_*` de complementares sem valor;
  - colunas de auditoria: `updated_by = updatedBy`, `updated_at = trx.fn.now()`;
  - **não** tocar `last_external_update_at` (Decisão 7).
- [ ] `updateRequesterEditable(trx, requesterId, block: UpdateRequesterBlock)`:
  - `UPDATE requesters` SET `area`, `manager_name`, `department`,
    `additional_contact` (`?? null` quando omitidos — substituição).
  - Nunca toca `full_name`/`corporate_email`/`created_at` (Decisão 4/6).

## 7. Service (regras de negócio)

Arquivo: `src/modules/requests/requests.service.ts`

- [ ] `updateInternalRequest(protocol, payload, actor, ipAddress)`:
  1. `const row = await repository.findUpdateContextByProtocol(protocol)` →
     sem resultado, `AppError("Solicitação não encontrada", 404)`.
  2. **Autorização #121** (após o `requireRole` do router já ter garantido perfil
     interno):
     - `actor.role === "Analista"` → `professional = findProfessionalByUserId(actor.id)`;
       se `!professional` ou `row.professional_id !== professional.professional_id`
       (inclui solicitação sem responsável) → `AppError("Acesso restrito às
solicitações atribuídas a você", 403)`.
     - `Administrador`/`Gestor` → seguem sem checagem extra.
  3. `previousValue = JSON.stringify(blocos editáveis atuais)` — montado a partir
     de `row` no mesmo shape do payload (`requester` editável, `demand`,
     `operational`, `complementary`).
  4. Transação (`db.transaction`, padrão `createRequest`/`assignResponsible`):
     - `updateRequestBlocks(trx, row.request_id, payload, actor.email)`;
     - `updateRequesterEditable(trx, row.requester_id, payload.requester)`;
     - `recordAudit(trx, { entityType: "request", actionType: "request.update",
entityId: protocol, userId: actor.id,
previousValue, newValue: JSON.stringify(payload),
note: ipAddress, changeOrigin: "admin" })`.
  5. Retorno `await findInternalByProtocol(protocol)` (reuso do mapeador do GET —
     garante formato idêntico ao contrato).

## 8. Controller e Router

Arquivo: `src/modules/requests/requests.controller.ts`

- [ ] Ampliar `actorFromRequest(req)` para retornar também `role: req.user.role`
      (mudança aditiva — `patchAssignee` continua funcionando).
- [ ] `patchInternalRequestByProtocol(req, res)`:
  1. `assertProtocolParam(req)`;
  2. `updateRequestPayloadSchema.safeParse(req.body)`; em erro →
     `throw new ValidationError(formatZodFieldErrors(parsed.error).fields, formatZodFieldErrors(parsed.error).message)`;
  3. `service.updateInternalRequest(protocol, parsed.data, actorFromRequest(req), req.ip)`;
  4. `res.status(200).json(updated)`.

Arquivo: `src/modules/requests/requests.router.ts`

- [ ] Completar a rota esqueleto:
  ```ts
  requestsRoutes.patch(
    "/:protocol/internal",
    authMiddleware,
    requireRole("Analista", "Gestor", "Administrador"),
    patchInternalRequestByProtocol,
  );
  ```
  (mesmos middlewares do GET interno; o 403 da regra #121 sai do service.)

## 9. Auditoria (catálogo)

Arquivo: `src/shared/audit/auditCatalog.ts`

- [ ] `request.actions`: adicionar `"update"` →
      `actions: ["assign", "reassign", "unassign", "status_change", "update"]`.

## 10. Verificação estática

- [ ] `npm run typecheck` sem erros.
- [ ] `npm run lint` sem erros.
- [ ] `npm run format:check` limpo (ou `npm run format` antes).

## 11. Testes manuais (roteiro — validação da entrega)

Sem suíte automatizada. Usar `curl` contra `http://localhost:3000` com a
aplicação e o banco de desenvolvimento rodando (seeds populados). Registrar a
requisição, a resposta e o resultado em cada caso.

Preparação:

- Logar com um Administrador: `POST /auth/login` → capturar cookie `session_id`.
- Escolher um protocolo existente do seed (ex.: consultar `GET /requests/MAAT-…/internal`).
- Logar também com um `Solicitante` e um `Analista` para os casos de `403`.

Casos:

| #   | Cenário                                                                                                                                                                                                                                                         | Esperado                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Sem cookie `session_id`                                                                                                                                                                                                                                         | `401` envelope padrão                                                         |
| 2   | Cookie de `Solicitante`                                                                                                                                                                                                                                         | `403` (`Acesso restrito ao perfil Analista ou Gestor ou Administrador`)       |
| 3   | Protocolo inexistente com Admin                                                                                                                                                                                                                                 | `404` `Solicitação não encontrada`                                            |
| 4   | `demand.title` ausente                                                                                                                                                                                                                                          | `422` + `fields["demand.title"]`                                              |
| 5   | `peopleInvolved: 0`                                                                                                                                                                                                                                             | `422` + `fields["operational.peopleInvolved"]`                                |
| 6   | `monthlyEffortHours: -1`                                                                                                                                                                                                                                        | `422` + `fields["operational.monthlyEffortHours"]`                            |
| 7   | `desiredDeadline` no passado                                                                                                                                                                                                                                    | `422` + `fields["operational.desiredDeadline"]`                               |
| 8   | `hasManualControls: ""` (Sim sem detalhe)                                                                                                                                                                                                                       | `422` + `fields["operational.hasManualControlsDetail"]` (chave **da UI**)     |
| 9   | Complementar `hasProcessDocumentation: ""`                                                                                                                                                                                                                      | `422` + `fields["complementary.hasProcessDocumentation"]`                     |
| 10  | PATCH válido completo (Admin)                                                                                                                                                                                                                                   | `200` com `RequestInternalDetailDTO` refletindo os novos valores              |
| 11  | Enviar `fullName`/`corporateEmail` alterados + payload válido                                                                                                                                                                                                   | `200`; GET interno mantém `fullName`/`corporateEmail` originais               |
| 12  | Enviar `department`/`additionalContact`/`complementary.additionalNotes` omitidos                                                                                                                                                                                | `200`; GET interno sem essas chaves; banco com `NULL` (substituição completa) |
| 13  | `complementary` inteiro omitido                                                                                                                                                                                                                                 | `200`; GET interno **sem** a chave `complementary`                            |
| 14  | Analista editando solicitação **não atribuída a ele**                                                                                                                                                                                                           | `403` (`Acesso restrito às solicitações atribuídas a você`)                   |
| 15  | Analista editando solicitação atribuída a ele                                                                                                                                                                                                                   | `200`                                                                         |
| 16  | Gestor/Admin editando qualquer solicitação                                                                                                                                                                                                                      | `200`                                                                         |
| 17  | Persistência: `updated_at` renovado; `updated_by` = ator; `last_external_update_at` **inalterado** (conferir `GET /requests/:protocol` público antes/depois)                                                                                                    | conforme                                                                      |
| 18  | Auditoria: `GET /audit/:protocol` **ainda não existe** no backend — validar via consulta direta a `audit_history` no banco (`docker compose exec postgres`): evento `request.update`, `previous_value`/`new_value` (JSON dos blocos), `change_origin = 'admin'` | conforme                                                                      |

Evidências a registrar:

- Saída dos `curl` (status + corpo) dos cenários 1–18;
- consulta a `audit_history` do protocolo (SQL no container, já que o
  `GET /audit/:protocol` não está implementado);
- resultado de `npm run typecheck`, `npm run lint`, `npm run format:check`.

**Execução dos testes** (registro — executado pelo autor em 2026-09-18 neste
ambiente: Docker + seeds, app `npm run start` na porta 3000):

Resultado resumido:

| #   | Cenário                                                     | Resultado                                                                                                                                                                                                |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sem cookie `session_id`                                     | ✅ `401` `{"status":"error","statusCode":401,"message":"Token não fornecido"}`                                                                                                                           |
| 2   | Cookie de `Solicitante`                                     | ✅ `403` `"Acesso restrito ao perfil Analista ou Gestor ou Administrador"`                                                                                                                               |
| 3   | Protocolo inexistente (Admin)                               | ✅ `404` `"Solicitação não encontrada"`                                                                                                                                                                  |
| 4   | `demand.title` ausente                                      | ✅ `422` + `fields["demand.title"]="Campo obrigatório."`                                                                                                                                                 |
| 5   | `peopleInvolved: 0`                                         | ✅ `422` + `fields["operational.peopleInvolved"]="Deve ser maior que zero."`                                                                                                                             |
| 6   | `monthlyEffortHours: -1`                                    | ✅ `422` + `fields["operational.monthlyEffortHours"]="Não pode ser negativo."`                                                                                                                           |
| 7   | `desiredDeadline` no passado                                | ✅ `422` + `fields["operational.desiredDeadline"]="O prazo desejado deve ser hoje ou uma data futura."`                                                                                                  |
| 8   | `hasManualControls: ""`                                     | ✅ `422` + `fields["operational.hasManualControlsDetail"]` (chave **da UI** via `UI_FIELD_KEYS`)                                                                                                         |
| 9   | `complementary.hasProcessDocumentation: ""`                 | ✅ `422` + `fields["complementary.hasProcessDocumentation"]`                                                                                                                                             |
| 10  | PATCH válido completo (Admin)                               | ✅ `200` com novos valores refletidos no GET interno (título, área, deadline, esforço, detalhe manual, anotação)                                                                                         |
| 11  | `fullName`/`corporateEmail` alterados                       | ✅ `200`; GET interno mantém `Maria Silva`/`maria.silva@empresa.com` (ignorados silenciosamente)                                                                                                         |
| 12  | `department`/`additionalContact`/`additionalNotes` omitidos | ✅ `200`; GET sem as chaves; banco com `NULL` (CONFIRMADO via SQL: `department=NULL`, `additional_contact=NULL`, `additional_notes=NULL`)                                                                |
| 13  | `complementary` inteiro omitido                             | ✅ `200`; GET interno **sem** a chave `complementary`; flags no banco `NULL`                                                                                                                             |
| 14  | Analista em solicitação não atribuída                       | ✅ `403` `"Acesso restrito às solicitações atribuídas a você"`                                                                                                                                           |
| 15  | Analista em solicitação atribuída a ele                     | ✅ `200` (roberta.analista editou MAAT-3B8L-4W2S)                                                                                                                                                        |
| 16  | Gestor/Admin em qualquer solicitação                        | ✅ `200` (gestor em MAAT-2R7Q-4M1C sem responsável; admin idem)                                                                                                                                          |
| 17  | Persistência                                                | ✅ `updated_at` renovado; `updated_by` = ator (admin/roberta/gestor); `last_external_update_at` **inalterado** (permaneceu `NULL` do snapshot)                                                           |
| 18  | Auditoria (`audit_history`)                                 | ✅ 5 eventos `request.update` (MAAT-8K3P-9X2M, `user_id=102`, `change_origin='admin'`, `note='::1'`) + 1 (MAAT-3B8L-4W2S, `user_id=107`); `previous_value`/`new_value` JSON válido (dict)                |
| —   | Estáticos                                                   | ✅ `npm run typecheck` e `npm run lint` limpos. `format:check` com avisos **pré-existentes** fora do escopo (módulo prioritization, `requireRole.ts`, migration, templates locais `.md` não versionados) |

Artefatos das execuções (bodies/status completos) coletados em
`curl`/SQL durante a execução em 2026-09-18 (servidor reiniciado após a
implementação para carregar a rota PATCH).

## 12. Finalização

- [x] Conferir critérios de aceite da issue `issue-backend-update-request-internal.md`
      (todos marcáveis, com a ressalva de testes manuais).
- [x] `npm run typecheck` e `npm run lint` verdes. `npm run format:check` com
      avisos **pré-existentes e fora do escopo** (módulo `prioritization`,
      `requireRole.ts`, migration e templates locais `.md` não versionados) —
      arquivos da feature formatados.
- [ ] Commit(s) seguindo o padrão do repo (mensagens em inglês/área) e abrir Pull
      Request no padrão `padrao-pr.md`, referenciando a issue e o contrato
      finalizado.
- [x] Registrar na issue: decisões aprovadas, roteiro executado, evidências e
      (pendente) link da PR.
