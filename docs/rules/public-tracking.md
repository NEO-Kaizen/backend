# Acesso público e acompanhamento do solicitante

## Modo de acesso

`portalConfig.solicitationMode` decide o comportamento das rotas públicas:

- **`PUBLIC`** — o formulário e o acompanhamento aceitam solicitante sem conta.
- **`AUTHENTICATED`** — o fluxo público é fechado: `GET /requests`,
  `GET /requests/:protocol` e `POST /requests` exigem sessão.

O guard `requireAccessMode()` é aplicado **apenas** nessas três rotas. O restante
tem regras próprias:

| Rota                                     | `PUBLIC`              | `AUTHENTICATED`                           |
| ---------------------------------------- | --------------------- | ----------------------------------------- |
| `GET /requests`                          | e-mail na query       | sessão; `?email=` recusado com `400`      |
| `GET /requests/:protocol`                | protocolo basta       | sessão; protocolo de terceiro → `404`     |
| `POST /requests`                         | identidade no payload | sessão; identidade vem do usuário         |
| `GET /requests/:protocol/tracking`       | identidade verificada | sessão do dono; sem dono → `403`          |
| `POST /requests/:protocol/public/verify` | identidade válida     | `403` (verificação indisponível)          |
| Pendências (listar/responder/anexar)     | identidade verificada | **não checa o modo** (dívida; ver abaixo) |

> ⚠ **Dívida de segurança:** as rotas de pendências não chamam
> `requireAccessMode()`. Em `AUTHENTICATED`, uma identidade pública previamente
> validada (ou adivinhada) ainda consegue listar/responder/anexar pendências.
> O `POST /public/verify` já responde `403`, mas as demais rotas não. A
> correção pendente é aplicar o guard ou validar o modo no service.

`GET /requests/:protocol` é uma **exceção aceita** ao ADR-0003: em `PUBLIC` ele
devolve o detalhe público só com o protocolo. O fluxo que exige identidade é o
`/tracking`; o endpoint antigo permanece por compatibilidade.

## Identidade pública

O solicitante comprova identidade com **protocolo + nome + e-mail**, sem criar
sessão:

1. `POST /requests/:protocol/public/verify` recebe `{ name, email, protocol }`.
2. O backend revalida contra o cadastro da solicitação.
3. A resposta é `{ protocol, canAccess: true }` — **sem novo JWT, sem novo
   cookie**.

Precedência de erros do `verify`:

1. `429` — rate-limit (10 tentativas / 10 minutos por IP + protocolo; todas as
   tentativas contam);
2. `400` — body malformado (`name` < 3, e-mail inválido, `protocol` ausente);
3. `403` — portal em `AUTHENTICATED`;
4. `401` — identidade divergente ou solicitação inexistente.

Normalização na comparação:

- nome: `trim`, minúsculas, sem acentos;
- e-mail: `trim`, minúsculas;
- protocolo: precisa ser idêntico ao `:protocol` da URL (anti-IDOR).

Divergência, ausência ou protocolo inexistente respondem o **mesmo** `401`
genérico (“Valide seus dados para acompanhar esta solicitação.”), sem revelar
qual campo divergiu nem se o protocolo existe. “Expiração” não é detectada pelo
backend: a TTL é do cliente.

## Reuso da identidade

O frontend guarda `{ protocol, name, email, verifiedAt }` em `sessionStorage`
com **vida útil da página** e descarta ao sair de `/acompanhar/[protocolo]`. Um
novo acesso exige novo `verify`.

Nas chamadas seguintes, a identidade vai no header:

```http
X-Requester-Identity: {"name":"Maria Silva","email":"maria@empresa.com"}
```

O backend revalida nome/e-mail/protocolo a cada chamada. A TTL de referência é
30 min do lado do cliente; o backend não confia nela.

## Dual-auth

As rotas de acompanhamento e de pendências aceitam cookie de sessão **ou**
`X-Requester-Identity`, mas com regras diferentes:

### Tracking (`GET /requests/:protocol/tracking`)

- Sessão de **Solicitante**: o dono é `requests.requester_user_id`; em
  solicitações legadas sem vínculo, compara o e-mail normalizado. Protocolo de
  terceiro → `404`.
- Sessão de perfil **interno** → `403` (“Perfis internos devem acompanhar pela
  consulta interna”).
- Sem cookie: identidade pública verificada; em `AUTHENTICATED` → `403`.

### Pendências

- Sessão de **Solicitante**: compara nome **e** e-mail da conta com a
  solicitação.
- Sessão **interna**: qualquer perfil interno passa sem checagem de custódia
  nessas rotas (a custódia é exigida apenas em criar/revisar).
- Sem cookie: identidade pública verificada.

## Recorte do acompanhamento

`GET /requests/:protocol/tracking` devolve
`{ mode: "public" | "authenticated", details }`:

- `public` — protocolo, status público, datas, reunião, blocos de identidade e
  demanda, impactos resumidos e `lastTechnicalMessage`.
- `authenticated` — o mesmo recorte **mais** o bloco operacional completo,
  complementar, preferências de horário, data de mapeamento e anexos.

Nunca inclui triagem, priorização, notas internas ou dados de outros
solicitantes.

## Anti-enumeração

- Respostas de identidade inválida não distinguem “protocolo inexistente” de
  “nome/e-mail divergente”.
- A listagem por e-mail só devolve as solicitações do e-mail informado/sessão.
- O protocolo é gerado por FPE (Feistel) sobre o id interno; não é sequencial
  nem enumerável.
