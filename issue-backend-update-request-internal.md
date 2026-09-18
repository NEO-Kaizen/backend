# BACKEND — Implementar atualização interna da solicitação via PATCH

## Contexto

A tela de especificação da solicitação (`/(admin)/fila/[protocolo]`) possui um
modo de **edição inline** que permite ajustar os blocos do cadastro. O lado de
leitura já existe: o `GET /requests/:protocol/internal` (issue #48) retorna os
4 blocos completos (`requester`, `demand`, `operational`, `complementary`) via
`RequestInternalDetailDTO`. Falta a contraparte de escrita — um endpoint que
persista as alterações desses blocos.

O contrato de atualização é uma **proposta** (`contract-request-update.md`)
com método, caminho e alguns comportamentos ainda em aberto (ver
"Dependências — Decisões"). O esqueleto da rota já existe no router sem
handler:

```ts
// src/modules/requests/requests.router.ts
requestsRoutes.patch("/:protocol/internal");
```

O backend atual não possui nenhum endpoint de edição dos blocos internos:
o `PUT /requests/:protocol` previsto na especificação (§"Editar solicitação")
é o fluxo público/solicitante, com campos parciais — fora do escopo desta
tarefa.

## Objetivo

Implementar o `PATCH /requests/:protocol/internal` que atualiza os blocos
editáveis da solicitação (área/gestor/departamento/contato adicionais do
solicitante, bloco de demanda completo, bloco operacional completo e bloco
complementar opcional), autenticado por cookie de sessão e restrito aos
perfis internos, com validação segundo o contrato, persistência transacional,
auditoria e resposta com o `RequestInternalDetailDTO` atualizado.

## Escopo

### Incluído

- Endpoint `PATCH /requests/:protocol/internal` (confirmar método/caminho no
  contrato — ver Dependências, Decisão 1).
- Autenticação por cookie de sessão (`authMiddleware`) e restrição aos perfis
  internos `Analista`/`Gestor`/`Administrador` (`requireRole`), alinhado ao
  GET interno; autorização por perfil conforme issue #121 (Decisão 5).
- DTO `UpdateInternalRequestPayload` com os mesmos 4 blocos do GET, apenas os
  editáveis:
  - `requester`: `area`, `manager`, `department?`, `additionalContact?`
    (`fullName`/`corporateEmail` são imutáveis — ignorados silenciosamente,
    Decisão 4);
  - `demand`: todos os campos, mesmos formatos do GET;
  - `operational`: todos os campos, mesmos formatos do GET
    (`peopleInvolved`/`monthlyEffortHours` como `number`; `desiredDeadline`
    como data `yyyy-mm-dd`);
  - `complementary`: opcional; campos sem valor omitidos (chave ausente).
- Validação Zod reutilizando os schemas de bloco existentes no
  `createRequestPayloadSchema` (`requests.schema.ts`), com ajustes:
  - `requester` restrito aos campos editáveis;
  - `desiredDeadline` hoje ou futura (regra nova do contrato);
  - `peopleInvolved` inteiro `>= 1`; `monthlyEffortHours` `>= 0`;
  - `hasManualControls` sempre presente e com detalhamento quando "Sim";
  - complementares: se algum `has*` for "Sim", o detalhe correspondente é
    obrigatório;
  - normalização da UI (`.trim()`, opcionais vazios omitidos, `YesNoDetail`
    como `false | string | omitido`) compatível com `optionalString` atual.
- Resposta de erro de validação conforme a Decisão 3 — esperado `422` com
  chaves de campo no formato usado pela UI (ex.: `demand.title`,
  `operational.hasManualControlsDetail`), no envelope padrão
  `{ status, statusCode, message }`.
- Persistência transacional (mesmo padrão de `createRequest`):
  - `UPDATE requests` nas colunas de `demand`/`operational`/`complementary`
    - `updated_by` (ator) e `updated_at`;
  - `UPDATE requesters` em `area`/`department`/`manager_name`/
    `additional_contact` (decidir impacto do deduplicado por e-mail — ver
    Observações).
- Auditoria na mesma transação: novo `actionType` `request.update` no
  `auditCatalog`, com `recordAudit` (ator, `previousValue`/`newValue`,
  origem `admin`).
- Erros: `401` (não autenticado), `403` (sem permissão), `404` (protocolo
  inexistente), `422` (validação), `500` — envelope padrão.
- Contrato final documentado (resolver as Questões em aberto do
  `contract-request-update.md`) e testes.

### Não incluído

- Alteração de `fullName`/`corporateEmail` do solicitante (imutáveis).
- Blocos e entidades fora do contrato: `status`, `priority`/`prioritization`,
  `professional_id` (responsável), `internalObservations`, `schedulePreferences`,
  anexos, reunião de mapeamento, `estimatedCompletion`.
- Fluxo de pendência de edição de campo (`pending_items` / `field_edit`) —
  sem contrato definido para esta tarefa.
- Retrofit ou alinhamento de regras no `POST /requests` (ex.: `desiredDeadline`
  hoje ou futura, que hoje valida apenas o formato) — se aprovado, virar item
  separado (ver Observações).
- Migration de banco — nenhuma coluna nova é esperada.
- Upload/download de anexos.

## Entregável

Endpoint `PATCH /requests/:protocol/internal` implementado no módulo
`requests` (controller + service + schema + repository), com validação,
persistência transacional, auditoria e contrato final resolvido. Inclui
documentação do contrato, testes e `typecheck`/`lint` sem erros.

## Critérios de aceite

- [x] `PATCH /requests/:protocol/internal` responde `200` com o
      `RequestInternalDetailDTO` atualizado (formato idêntico ao do
      `GET /requests/:protocol/internal` — mesmo mapeador).
- [x] Sem cookie de sessão ou token inválido/expirado → `401`.
- [x] Perfil `Solicitante` autenticado → `403`; demais perfis internos →
      autorização da issue #121 (Decisão 5) aplicada.
- [x] Protocolo inexistente → `404`. Sem permissão para editar a solicitação
      (quando aplicável) → `403`.
- [x] `fullName`/`corporateEmail` enviados no payload são **ignorados
      silenciosamente** (Decisão 4) — não causam erro nem alteram os dados.
- [x] Validação conforme o contrato: `requester.area` e `requester.manager`
      obrigatórios; blocos `demand`/`operational` com todos os campos
      obrigatórios; `peopleInvolved` inteiro `>= 1`; `monthlyEffortHours`
      `>= 0`; `desiredDeadline` hoje ou futura; `hasManualControls` sempre
      presente com detalhe quando "Sim"; complementares opcionais com detalhe
      obrigatório quando o `has*` for "Sim".
- [x] Erro de validação → `422` com chaves de campo no formato acordado
      (ex.: `demand.title`, `operational.hasManualControlsDetail`) dentro do
      envelope `{ status, statusCode, message }`.
- [x] Persistência: `requests` atualizada nos blocos editados e
      `requesters` na área/departamento/gestor/contato; `updated_by` reflete o
      ator e `updated_at` é renovado.
- [x] Auditoria: evento `request.update` gravado na **mesma transação** da
      atualização (`recordAudit`), com valor anterior e novo dos blocos.
- [x] `complementary` opcional preservado: chave ausente quando nenhum campo
      foi respondido; campos sem valor não persistidos como string vazia.
- [x] Blocos reutilizam os tipos do GET (`Pick<InternalRequestDetail,
'requester' | 'demand' | 'operational' | 'complementary'>`) sem drift
      de contrato.
- [x] `npm run typecheck` e `npm run lint` sem erros.
- [x] Testes manuais executados cobrindo os cenários desta Issue (ver
      "Evidências esperadas" e o roteiro de testes manuais no plano de execução).
- [x] Questões em aberto 1–5 do contrato resolvidas e documentadas.

## Dependências

### Decisões (questões em aberto do `contract-request-update.md`)

**Resolvidas em 2026-09-18** (registradas no contrato e seguidas na implementação):

1. **Método e URL** — mantido `PATCH /requests/:protocol/internal` (semântica
   de atualização parcial, simétrica ao GET e à rota esboçada no router).
2. **Resposta** — mantido `200` com o `RequestInternalDetailDTO` atualizado
   (a tela usa o retorno para atualizar o estado da especificação).
3. **Formato do `422`** — envelope padrão + campo `fields` com as mensagens por
   chave **da UI** (mapa `UI_FIELD_KEYS` em `zodErrors.ts` traduz
   `operational.hasManualControls` → `operational.hasManualControlsDetail`).
4. **`fullName`/`corporateEmail`** — **ignorados silenciosamente** (schema
   derivado de `requesterSchema` com `.omit({ fullName, corporateEmail })`).
5. **Autorização por perfil (issue #121) — regra completa**: Administrador e
   Gestor editam qualquer solicitação; Analista apenas as atribuídas a ele
   (`requests.professional_id` = seu `details_professional.professional_id`).
   Solicitação sem responsável não é editável por Analista. Sempre `403`
   `"Acesso restrito às solicitações atribuídas a você"`.

Complementos alinhados com Frontend durante o planejamento:

- Semântica de **substituição completa** dos blocos: chave ausente = campo
  limpo (NULL), inclusive `complementary` omitido por inteiro.
- `last_external_update_at` **não** é tocado por edição interna;
  `updated_by` = e-mail do ator e `updated_at` renovado.
- `requesters` pode ser compartilhado entre solicitações pelo e-mail →
  atualização afeta o registro comum (área/departamento/gestor/contato).

### Outras

- Contrato de proposta: `contract-request-update.md` (referência principal).
- Contrato GET interno (issue #48): `docs/requests-internal-query-contract.md`
  — fonte dos tipos de bloco e do mapeador de resposta reutilizável.
- Issue #121 — autorização por perfil (admin vs. analista).
- Base de validação existente: `createRequestPayloadSchema` em
  `src/modules/requests/requests.schema.ts`.
- Nenhuma dependência de banco (sem coluna nova esperada).

## Referências

- Contrato: [`contract-request-update.md`](./contract-request-update.md)
- GET interno: [`docs/requests-internal-query-contract.md`](./docs/requests-internal-query-contract.md)
- Especificação: [`funcionalidades-especificacao.md`](./funcionalidades-especificacao.md) §"Editar solicitação"
- Persistência: [`docs/database/requests-persistence.md`](./docs/database/requests-persistence.md)
- Código atual:
  - `src/modules/requests/requests.router.ts` (rota esqueleto)
  - `src/modules/requests/requests.controller.ts`
  - `src/modules/requests/requests.service.ts`
  - `src/modules/requests/requests.schema.ts`
  - `src/modules/requests/requests.repository.ts`
  - `src/modules/DTOs/requests/RequestInternalDetail.dto.ts`
  - `src/shared/audit/auditCatalog.ts` (novo `request.update`)
- Padrão de Issues: [`padrao-issues.md`](./padrao-issues.md)

## Evidências esperadas

- Requisição/resposta de exemplo do PATCH (`200` e os erros `401`, `403`,
  `404`, `422`).
- Log de auditoria com o evento `request.update` (valor anterior e novo).
- `npm run typecheck` e `npm run lint` limpos.
- Roteiro de testes manuais executado (cenários e resultados registrados) —
  sem suíte de testes automatizados (ver Observações).
- Pull Request relacionada e contrato final atualizado/documentado.

## Observações

- **Stack real**: o projeto usa **Knex** (migrations + query builder) e não
  Prisma — seguir os padrões de repositório existentes
  (`requests.repository.ts`, transações com `db.transaction`).
- **Chave de erro da UI**: a interface espera
  `operational.hasManualControlsDetail` no `422`, mas o campo do payload é
  `operational.hasManualControls`. O mapeador de erros do Zod precisa traduzir
  o path para a chave exibida pela UI (Decisão 3).
- **Deduplicação do solicitante**: `requesters` é deduplicado por
  `corporate_email`; atualizar `area`/`department`/`manager_name`/
  `additional_contact` altera **todas** as solicitações daquele e-mail. Decidir
  se isso é aceitável (característica da pessoa) ou se exige clonar o registro
  do solicitante por solicitação.
- **`last_external_update_at`**: o GET interno lê `lastUpdate` de
  `requests.updated_at`; o GET público lê `last_external_update_at`. Decidir se
  a edição administrativa dos dados também atualiza o campo público (o
  solicitante veria o `lastUpdate` mudar na consulta pública).
- **Testes**: decisão da equipe é **teste manual** — sem suíte automatizada
  (Vitest/Supertest ou outro). A validação será por roteiro manual: subir a
  aplicação, logar, disparar o PATCH com casos de sucesso/erro e registrar o
  resultado como evidência.
- **Regra nova de `desiredDeadline`**: "hoje ou futura" não é validada no
  `POST /requests` atual (apenas o formato). O PATCH passa a validar; se o
  alinhamento de contrato preferir, o POST deve ser ajustado em issue própria.
- **Granularidade de auditoria**: avaliar se basta registrar o bloco inteiro
  (JSON em `previousValue`/`newValue`) ou se é necessário diff campo a campo —
  recomendado: JSON dos blocos, simples e suficiente para o `GET /audit/:protocol`.
