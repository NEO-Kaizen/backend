# Contrato — PATCH Internal Request

Atualização dos blocos editáveis da solicitação, usada pelo modo de edição
inline da tela de especificação (`/(admin)/fila/[protocolo]`). Os blocos
reutilizam os tipos do contrato GET (`internal-request-contract.md`).

> **Status: FECHADO (consolidado 2026-09-18)** — método/caminho, resposta,
> formato de erro, tratamento de `fullName`/`corporateEmail` e autorização
> aprovados conforme "Questões em aberto" abaixo; implementado em
> `feat/88-implement-internal-request-update-via-patch`.

## Endpoint

```http
PATCH /requests/{protocol}/internal
```

- `protocol`: protocolo da solicitação, URL-encoded.
- Auth: cookie de sessão (`credentials: include`). Sem token no header.
- `Content-Type: application/json`.
- Resposta 200: `InternalRequestDetail` atualizado (equivalente ao GET).

## Request body — `UpdateInternalRequestPayload`

```ts
// Mesmos 4 blocos do GET, apenas os editáveis. `fullName`/`corporateEmail`
// (requester) são imutáveis: o frontend os envia com o valor original; o
// backend deve ignorá-los.
type UpdateInternalRequestPayload = Pick<
  InternalRequestDetail,
  "requester" | "demand" | "operational" | "complementary"
>;

type YesNoDetail = false | string; // false = "Não", string = "Sim" + detalhamento
```

- `requester`: `area`, `manager` e opcionais `department`/`additionalContact`.
- `demand` / `operational`: mesmos campos e formatos do GET —
  `peopleInvolved`/`monthlyEffortHours` como `number`; `desiredDeadline` como
  data (`yyyy-mm-dd`).
- `complementary`: opcional — pode ser omitido; campos sem valor são omitidos
  (sem chave). `undefined`/`null` não são enviados.

## Normalização aplicada pela UI

- Strings enviadas com `.trim()`.
- Opcionais vazios (`department`, `additionalContact`, `additionalNotes`,
  detalhes complementares) → campo omitido.
- `peopleInvolved` / `monthlyEffortHours` → `number`.
- `hasManualControls`: `false` | string (`trim`); campo sempre presente
  (obrigatório).
- Complementares `YesNoDetail`: `false` | string (`trim`) | campo omitido.
- A UI não envia payload com erro de validação (save bloqueado até validar).

## Validação (esperada no backend)

- `requester.area` e `requester.manager`: obrigatórios, apenas texto.
- `demand.*`: todos os campos obrigatórios.
- `operational.*`: todos obrigatórios; `peopleInvolved` inteiro >= 1;
  `monthlyEffortHours` >= 0; `desiredDeadline` hoje ou futura;
  `hasManualControls` exige escolha e, se "Sim", detalhe.
- `complementary.*`: opcionais; se algum `has*` = "Sim", seu detalhe é
  obrigatório.

## Erros

Envelope:

```ts
interface ApiErrorResponse {
  status: "error";
  statusCode: number;
  message: string;
}
```

| Status | Significado                                |
| ------ | ------------------------------------------ |
| 401    | Não autenticado                            |
| 403    | Sem permissão para editar esta solicitação |
| 404    | Protocolo não encontrado                   |
| 422    | Erro de validação (envelope + `fields`)    |
| 500    | Erro interno                               |

Em `422`, o envelope padrão carrega o campo adicional `fields` com as
mensagens por chave **da UI**:

```ts
interface ApiErrorResponse422 extends ApiErrorResponse {
  fields: Record<string, string>;
}
```

A tradução de caminho Zod → chave da UI acontece no mapeador de erros
(`buildZodFieldErrors` em `src/shared/validation/zodErrors.ts`); em particular
`operational.hasManualControls` é exposto como
`operational.hasManualControlsDetail`.

## Questões em aberto — RESOLVIDAS

1. **Método e URL** — mantido `PATCH /requests/:protocol/internal`.
2. **Resposta** — `200` com o detalhe atualizado (idêntico ao GET interno;
   mesmo mapeador).
3. **Formato do `422`** — envelope padrão `{ status, statusCode, message }` +
   `fields` com chaves da UI (`demand.title`,
   `operational.hasManualControlsDetail` etc.).
4. **`fullName`/`corporateEmail`** — **ignorados silenciosamente** (schema do
   PATCH deriva de `requesterSchema` com `.omit({ fullName, corporateEmail })`).
5. **Autorização (issue #121)** — Administrador/Gestor editam qualquer
   solicitação; Analista apenas as atribuídas a ele
   (`requests.professional_id` = seu `details_professional.professional_id`);
   sem responsável não é editável por Analista (`403`).

## Comportamentos adicionais consolidados (complementos aprovados)

- **Substituição completa**: o payload é o estado final dos blocos — campo
  ausente = limpo (NULL no banco), inclusive `complementary` omitido inteiro.
- `last_external_update_at` **não** é alterado por edição interna;
  `updated_by` = e-mail do ator; `updated_at` renovado.
- `requesters` pode ser compartilhado entre solicitações (deduplicado por
  e-mail): a atualização afeta o registro comum
  (área/departamento/gestor/contato).
- Auditoria: `request.update` gravado na mesma transação
  (`previous_value`/`new_value` = JSON dos blocos; `change_origin = 'admin'`).
