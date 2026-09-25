# Neo Kaizen — Backend

Esqueleto inicial do backend do projeto Neo Kaizen.

## Requisitos

- Node.js 24+ (recomendado: LTS mais recente)
- npm 9+
- Docker com o plugin Docker Compose (opcional: ambiente completo em containers)

## Instalação

```bash
npm install
```

## Configuração de ambiente

Copie o arquivo de exemplo e ajuste as variáveis conforme necessário:

```bash
cp .env.example .env
```

| Variável           | Descrição                                                                                  | Exemplo / Padrão        |
| ------------------ | ------------------------------------------------------------------------------------------ | ----------------------- |
| `PORT`             | Porta do servidor HTTP                                                                     | `3000`                  |
| `JWT_SECRET`       | Chave secreta usada para assinar e validar os tokens JWT                                   | `sua-chave-secreta`     |
| `JWT_EXPIRES_IN`   | Tempo de expiração dos tokens gerados                                                      | `1d`                    |
| `NODE_ENV`         | Ambiente de execução (`development`, `production`)                                         | `development`           |
| `CORS_ORIGINS`     | Origens permitidas para requisições cross-origin, separadas por `,`                        | `http://localhost:5173` |
| `COOKIE_NAME`      | Nome do cookie de sessão de autenticação                                                   | `session_id`            |
| `PROTOCOL_FPE_KEY` | Chave secreta do FPE/Feistel que gera o protocolo não enumerável (obrigatória em produção) | `sua-chave-fpe`         |
| `UPLOAD_DIR`       | Diretório onde os anexos das solicitações são gravados                                     | `uploads`               |

## Rodando com Docker

O ambiente completo (PostgreSQL + aplicação) sobe com um único comando, sem precisar instalar Node ou PostgreSQL na máquina:

```bash
cp .env.example .env
npm run docker:dev
```

O `docker compose up` inicia o PostgreSQL (aguardando o health check) e a aplicação com hot-reload via `--watch`. As variáveis do `.env` são usadas pelos containers; dentro da rede do compose o `DB_HOST` é sobrescrito para o serviço `postgres` e o `DB_PORT` para `5432`, enquanto o fluxo local usa o `localhost` e a `DB_PORT` do `.env`.

Para rodar as migrations no container (com o ambiente no ar):

```bash
npm run docker:migrate:latest
```

Para popular os dados de desenvolvimento:

```bash
npm run docker:seed:run
```

Para acrescentar cenários de demonstração/teste sem misturá-los às seeds-base:

```bash
npm run docker:seed:scenarios:run
```

As seeds de cenário ficam em `seeds/scenarios`, são executadas somente por esse
comando e pressupõem que as migrations e as seeds-base já tenham sido aplicadas.
Elas devem ser idempotentes para permitir novas execuções no mesmo banco. Para
executar apenas um cenário, informe seu arquivo com `--specific`:

```bash
npm run docker:seed:scenarios:run -- --specific=001_dashboard_demo.js
```

Para recriar o volume do banco e subir o ambiente do zero, aplicando migrations e seeds (recria o volume — **apaga os dados**; reconstrói a imagem, então use também após alterar `package.json`/`package-lock.json`):

```bash
npm run docker:db:setup
```

Para apenas remover os containers e o volume do banco:

```bash
npm run docker:db:reset
```

Para desfazer o último lote:

```bash
npm run docker:migrate:rollback
```

Para criar uma nova migration:

```bash
npm run docker:migrate:make -- nome-da-migration
```

Outros comandos úteis:

```bash
docker compose logs -f app
docker compose exec app npx tsc --noEmit
docker compose exec postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Notas:

- O PostgreSQL é publicado apenas em loopback (`127.0.0.1`), na porta definida por `DB_PORT` (padrão `5432`). Se essa porta estiver ocupada no host, defina `DB_PORT` com outra porta: os comandos npm executados no host usam esse valor, enquanto dentro da rede do compose o `DB_HOST` é sobrescrito para `postgres` e `DB_PORT` para `5432`.
- Os dados do PostgreSQL persistem no volume `postgres_data` entre `docker compose down` e `up`; use `docker compose down -v` para apagá-los.
- O `node_modules` do container `app` fica em um volume anônimo (`/app/node_modules`) que sobrepõe o da imagem. Por isso, após alterar `package.json`/`package-lock.json`, rode `npm run docker:db:setup` (reconstrói a imagem e recria os volumes) para instalar as dependências novas — `npm run docker:dev` sozinho continua usando o `node_modules` antigo.
- As credenciais do banco (`POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`, derivadas do `.env`) só inicializam o banco quando o volume está vazio. Alterá-las depois da primeira inicialização não muda o usuário e o banco existentes: recrie o ambiente com `docker compose down -v` (apaga os dados) ou ajuste as credenciais diretamente no banco.
- As imagens base estão fixadas por digest (`node:24-bookworm-slim` e `postgres:18-alpine`); atualize os digests periodicamente para receber correções de segurança.

## Banco de dados

O projeto utiliza PostgreSQL como banco de dados e Knex para gerenciamento das migrations.

As variáveis necessárias para conexão estão documentadas no arquivo `.env.example`.

A documentação da persistência (autenticação, pedidos e configuração global) está disponível em:

- [Persistência para autenticação](docs/database/authentication-persistence.md)
- [Persistência dos pedidos (solicitações)](docs/database/requests-persistence.md)
- [Persistência da configuração global](docs/database/system-settings-persistence.md)

As migrations e os seeds podem ser executados após a configuração das credenciais do banco:

```bash
npm run migrate:latest   # aplica as migrations pendentes
npm run seed:run         # popula os dados de desenvolvimento
npm run seed:scenarios:run # acrescenta cenários opcionais de demonstração/teste
```

Para aplicar migrations e seeds em sequência:

```bash
npm run db:setup
```

> Se o histórico de migrations estiver inválido (por exemplo, após migrations renomeadas ou removidas), recrie o banco de desenvolvimento com `npm run docker:db:reset` (remove o volume) e depois `npm run docker:db:setup`.

Os perfis iniciais da aplicação são inseridos automaticamente pela migration `insert_initial_profiles`.

Para desfazer o último lote de migrations:

```bash
npm run migrate:rollback
```

## Execução

```bash
npm start
```

Em modo desenvolvimento, com reload automático:

```bash
npm run dev
```

O servidor roda em `http://localhost:3000` (ou na porta definida em `PORT`).

## Endpoints

### Autenticação

#### POST /auth/login

Autentica o usuário com e-mail e senha. Em caso de sucesso, retorna os dados do usuário (sem a senha) e define um cookie de sessão HttpOnly com o token JWT.

- Body: `{ "email": "maria@instituicao.gov.br", "password": "123456" }`
- Resposta `200 OK`:

  ```json
  {
    "id": "1",
    "email": "maria@instituicao.gov.br",
    "name": "Maria Oliveira",
    "avatarUrl": "/uploads/avatars/1-foto.jpg",
    "role": "Analista",
    "mustChangePassword": false
  }
  ```

  `avatarUrl` é a URL relativa da foto do usuário ou `null`; `role` pode ser
  `Solicitante`, `Analista`, `Gestor` ou `Administrador`. Quando
  `mustChangePassword` é `true`, o cookie de sessão é emitido com escopo de
  troca de senha e o usuário deve concluir a troca antes de continuar.

- Resposta `400 Bad Request`: e-mail ou senha ausentes.
- Resposta `401 Unauthorized`: credenciais inválidas (e-mail não encontrado, senha incorreta, usuário ou perfil inativo — a resposta é genérica para não revelar o motivo).

#### POST /auth/logout

Encerra a sessão do usuário autenticado, removendo o cookie de sessão do navegador. O endpoint é idempotente — retorna sucesso mesmo quando não há sessão ativa.

- Body: nenhum
- Resposta `200 OK`:

  ```json
  { "message": "Sessão encerrada com sucesso" }
  ```

#### GET /auth/me

Retorna a sessão atual a partir do cookie de sessão HttpOnly. Valida o JWT e revalida usuário e perfil no banco a cada chamada, sem expor dados sensíveis.

- Resposta `200 OK`:

  ```json
  {
    "id": "1",
    "email": "maria@instituicao.gov.br",
    "name": "Maria Oliveira",
    "avatarUrl": "/uploads/avatars/1-foto.jpg",
    "role": "Analista",
    "mustChangePassword": false
  }
  ```

- O endpoint também responde `200` quando a senha está pendente de troca
  (`mustChangePassword: true`), permitindo que o frontend restaure a sessão e
  exiba a tela de troca de senha — é a única rota liberada nesse estado,
  junto de `PUT /auth/change-password`.
- Resposta `401 Unauthorized`: sem cookie (`Token não fornecido`) ou sessão inválida, expirada ou inativa (`Token inválido ou expirado` — resposta genérica).

### Solicitações

As rotas de solicitação (`POST /requests`, `GET /requests` e
`GET /requests/:protocol`) respeitam o **modo de abertura do portal**
(`system_settings.solicitation_mode`, definido em
`PATCH /portal-config/access`):

- **`PUBLIC`** (default): comportamento público — sem autenticação, como
  descrito abaixo.
- **`AUTHENTICATED`**: exige cookie de sessão válido nas três rotas (`401`
  sem sessão). Além disso, o acesso passa a ser escopado à identidade da
  sessão:
  - `POST /requests` sobrescreve `requester.fullName`/`requester.corporateEmail`
    com o cadastro do usuário logado (evita spoofing). Os campos seguem
    obrigatórios no payload (validação), mas não definem a identidade gravada;
    o vínculo é registrado em `requests.requester_user_id`.
  - `GET /requests` lista somente as solicitações do e-mail da sessão e
    **recusa** o parâmetro `?email=` com `400`.
  - `GET /requests/:protocol` retorna `404` para protocolos que não
    pertencem ao usuário logado (não revela a existência de terceiros).

#### POST /requests

Endpoint de cadastro de solicitação (gera o protocolo e persiste os blocos do
formulário, as preferências de horário e os anexos). Público no modo `PUBLIC`;
no modo `AUTHENTICATED` exige sessão e a identidade é resolvida pelo cadastro do
usuário logado (campos de identidade do payload são validados, porém
sobrescritos).

- Content-Type: `multipart/form-data`
- Parte `payload` (texto): `JSON.stringify` de `{ requester, demand, operational, complementary?, schedulePreferences? }`.
- Partes `attachments` (0 a 5 arquivos): cada uma com até 10MB, nos formatos PDF, DOCX, XLSX, PNG ou JPG.
- `schedulePreferences` é opcional; quando enviado, exige de 1 a 3 horários válidos (`AAAA-MM-DDTHH:MM`), sem duplicatas.
- Resposta `201 Created`:

  ```json
  {
    "protocol": "MAAT-8K3P-9X2M",
    "status": "Solicitação enviada",
    "createdAt": "2026-08-25T14:03:11.000Z"
  }
  ```

- Resposta `400 Bad Request`: payload ausente/JSON inválido, campo obrigatório ausente ou inválido, limite de caracteres excedido, resposta Sim/Não sem detalhamento, `schedulePreferences` com mais de 3 opções/duplicatas, anexo acima de 10MB ou formato não permitido, ou mais de 5 anexos. Envelope: `{ "status": "error", "statusCode": 400, "message": "..." }`.

#### GET /requests

Lista as solicitações vinculadas a um e-mail de solicitante, com dados
resumidos. Público no modo `PUBLIC` (o e-mail vem da query); no modo
`AUTHENTICATED` exige sessão, lista apenas o e-mail da sessão e recusa `?email=`
com `400`. O e-mail é normalizado para minúsculas antes da consulta.

- Query (somente no modo `PUBLIC`): `?email=maria.oliveira@instituicao.gov.br` (obrigatório)
- Resposta `200 OK`: array ordenado da solicitação mais recente para a mais antiga; retorna array vazio quando não há solicitações para o e-mail (sem revelar se o e-mail existe no sistema).

  ```json
  [
    {
      "protocol": "MAAT-8K3P-9X2M",
      "title": "Automatizar conferência de diárias",
      "status": "Solicitação enviada",
      "createdAt": "2026-08-25T14:03:11.000Z",
      "updatedAt": null
    }
  ]
  ```

- Resposta `400 Bad Request`: query param `email` ausente ou com formato inválido. Envelope: `{ "status": "error", "statusCode": 400, "message": "..." }`.

#### GET /requests/:protocol

Consulta da solicitação pelo protocolo de rastreio. Público no modo `PUBLIC`
(acompanhamento sem autenticação); no modo `AUTHENTICATED` exige sessão e
retorna `404` quando o protocolo não pertence ao usuário logado.

- Body: nenhum
- Exemplo: `GET /requests/MAAT-8K3P-9X2M`
- Resposta `200 OK`:
  ```json
  {
    "protocol": "MAAT-8K3P-9X2M",
    "demandTitle": "Automatizar conciliação bancária",
    "processName": "Conciliação bancária mensal",
    "status": "Em triagem",
    "assigneeName": "Fernando Alves",
    "openedAt": "2026-01-15T10:30:00.000Z",
    "estimatedCompletion": "2026-10-18",
    "mappingDate": "2026-10-15",
    "meeting": {
      "scheduledFor": "2026-10-15T13:30:00.000Z",
      "link": null
    },
    "pendingIssues": [],
    "nextStep": "Aguarde o contato do analista",
    "lastTechnicalMessage": null,
    "lastUpdate": "2026-01-16T14:20:00.000Z",
    "conclusion": null
  }
  ```
- Resposta `404 Not Found`: protocolo não encontrado.

#### GET /users/metrics

Endpoint protegido por autenticação e restrito ao perfil `Administrador` que
retorna as métricas consolidadas da base de usuários.

- Requer cookie/JWT válido e perfil `Administrador`
- Resposta `401 Unauthorized` sem sessão; `403 Forbidden` para perfil sem acesso
- Resposta `200 OK`:

  ```json
  {
    "total": 15,
    "active": 13,
    "pending": 3,
    "admins": 3
  }
  ```

- `total`: total de usuários cadastrados.
- `active`: usuários com conta ativa (`is_active = true`).
- `pending`: usuários com troca de senha pendente
  (`must_change_password = true` — senha temporária / primeiro acesso).
- `admins`: usuários vinculados ao perfil `administrador`.

Contrato completo (tipos, exemplos de erro e regras de contagem) em
[`docs/users-api-metrics-0_1.md`](docs/users-api-metrics-0_1.md).

### Fila de atendimento

#### GET /queue/metrics

Escopo adicional desta PR (fora do contrato da issue #46 — atende a tela Home).
Endpoint protegido por autenticação e restrito aos perfis internos (`Analista`,
`Gestor`, `Administrador`) que retorna as métricas consolidadas da fila.

- Requer cookie/JWT válido e perfil interno de triagem
- Resposta `401 Unauthorized` sem sessão; `403 Forbidden` para perfil sem acesso
- Resposta `200 OK`:

  ```json
  {
    "totalRequests": 128,
    "unassignedRequests": 31,
    "inProgressRequests": 54,
    "overdueRequests": 9
  }
  ```

- `totalRequests`: total de solicitações no sistema.
- `unassignedRequests`: solicitações sem profissional atribuído.
- `inProgressRequests`: solicitações nos status em andamento (`Em triagem`, `Em mapeamento`, `Em análise de viabilidade`, `Em desenvolvimento`, `Em homologação`).
- `overdueRequests`: solicitações com `desired_deadline` vencido e status diferente de `Concluído`/`Cancelado`.

#### GET /queue

Endpoint protegido por autenticação e restrito aos perfis internos (`Analista`,
`Gestor`, `Administrador`) que centraliza a listagem da fila com paginação,
busca e filtros.

Query params aceitos:

- `page` (obrigatório, inteiro >= 1)
- `pageSize` (obrigatório, inteiro entre 1 e 100)
- `search` (opcional): busca por protocolo, e-mail corporativo ou nome do solicitante
- `status` (opcional): valor exato de um status válido, como `Em triagem`, `Em desenvolvimento` ou `Concluído`
- `priority` (opcional): valor exato de prioridade, como `Baixa`, `Média`, `Alta` ou `Crítica`
- `assigneeId` (opcional): UUID do profissional (`details_professional.professional_id`) ou o literal `unassigned`
- `unassigned` (opcional): `true`/`1` para listar apenas solicitações sem responsável (`false`/`0` desliga) — não pode ser combinado com `assigneeId` (exceto com o próprio `unassigned`)

Exemplo:

```http
GET /queue?page=1&pageSize=10&status=Em%20triagem&priority=Alta&assigneeId=unassigned
```

Resposta `200 OK`:

```json
{
  "data": [
    {
      "protocol": "MAAT-8K3P-9X2M",
      "createdAt": "2026-08-25T14:03:11.000Z",
      "processName": "Conciliação bancária mensal",
      "priority": "Alta",
      "status": "Em triagem",
      "assignee": "Fernando Alves",
      "requesterName": "Maria Oliveira",
      "requesterEmail": "maria.oliveira@instituicao.gov.br",
      "assigneeId": "650e8400-e29b-41d4-a716-446655440001"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 42,
  "totalPages": 5,
  "assignees": [
    { "id": "650e8400-e29b-41d4-a716-446655440001", "name": "Fernando Alves" },
    { "id": "650e8400-e29b-41d4-a716-446655440003", "name": "Patrícia Gomes" }
  ]
}
```

- Os valores válidos para `status` incluem: `Solicitação enviada`, `Aguardando triagem`, `Em triagem`, `Pendente de informações`, `Aguardando mapeamento`, `Mapeamento agendado`, `Em mapeamento`, `Em análise de viabilidade`, `Elegível`, `Não elegível`, `Priorizado`, `Backlog`, `Direcionado para outra área`, `Em desenvolvimento`, `Em homologação`, `Concluído` e `Cancelado`.
- Os valores válidos para `priority` incluem: `Baixa`, `Média`, `Alta` e `Crítica`.
- Se `page` ou `pageSize` estiverem ausentes ou inválidos, a API retorna `400 Bad Request` com detalhes dos parâmetros inválidos.
- Quando `page` ultrapassa o total de páginas, a API ajusta a resposta para a última página válida (`page` = `totalPages`); com zero resultados, a `page` devolvida é `1`.
- A lista `assignees` contém apenas profissionais com `status = active`, ordenados por nome.

#### GET /queue/requests/:protocol/mapping

Subfluxo de Mapeamento do fluxo da fila (issue #86). Consulta o mapeamento **mais
recente** de uma solicitação (agendamento), incluindo o `id` do registro. Sem
mapeamento ainda, retorna `200` com o **estado vazio**: `id` e campos opcionais
`null` e `participants: []`.

- Requer cookie/JWT válido e perfil interno de triagem (`Analista`, `Gestor`,
  `Administrador`) — mesmo guard das rotas da fila.
- Resposta `401 Unauthorized` sem sessão; `403` para perfil sem acesso; `404`
  para protocolo inexistente; `200 OK`:

  ```json
  {
    "protocol": "MAAT-8K3P-9X2M",
    "id": "a6e8923e-7661-4827-9a6d-4898d9c70739",
    "scheduledFor": "2026-10-15T13:30:00Z",
    "durationMinutes": 60,
    "modality": "REMOTE",
    "meetingLink": "https://meet.exemplo.com/mapeamento",
    "location": null,
    "participants": [
      { "id": "103", "name": "Gestor Teste", "email": "gestor_teste@email.com" },
      { "id": null, "name": "João Silva", "email": "joao.silva@externo.com.br" }
    ],
    "notes": "Levantamento inicial da demanda."
  }
  ```

#### PUT /queue/requests/:protocol/mapping

Cria ou atualiza o mapeamento. Semântica do payload: campo **ausente mantém** o
valor atual; `null` **limpa**; `participants` presente **substitui** a lista. O
alvo é o mapeamento do `id` (quando informado e **aberto**; encerrado → `422`)
ou o mapeamento atual (mais recente não concluído); sem nenhum aberto, **cria**
um novo registro.

- Autorização (dois vínculos distintos, contrato §9): **campos do mapeamento**
  — o **designado do mapeamento** (`mappingAssignee.userId`) ou `Administrador`;
  **designação** (`mappingAssigneeId` no payload) — o **responsável pela
  solicitação**, o designado atual ou `Administrador`.
- Ao criar um mapeamento sem `mappingAssigneeId`, o designado **herda** o
  responsável da solicitação (delegação posterior via `mappingAssigneeId`;
  `null` remove; ausente mantém). Elegibilidade do designado: profissional
  ativo com perfil `analista`/`gestor`.
- `completeMapping: true` valida os dados mesclados, marca o mapeamento como
  concluído e altera o status da solicitação para **`Mapeamento agendado`**
  (auditado na mesma transação); `false` apenas persiste (`mapping.save`).
- Auditoria: `mapping.assign` registra cada definição/substituição/remoção do
  designado; `mapping.save`/`mapping.complete` registram o designado vigente no
  diff.
- Limites: `durationMinutes` 15–480; até **20 participantes**; `notes` ≤ 2.000;
  `meetingLink`/`location` ≤ 500; `scheduledFor` ISO-8601 **com offset**
  (persistido em UTC; resposta com sufixo `Z`); `REMOTE` exige `meetingLink` e
  `IN_PERSON` exige `location`.
- Status: `200` mapeamento atualizado; `400` payload malformado; `403` sem
  permissão; `404` protocolo/mapeamento inexistente; `422` validação de campos
  ou estado (inclusive solicitação em `Concluído`/`Cancelado` — "solicitação
  encerrada").

- `participants[].id` é o `users.user_id` serializado como string quando o
  participante é usuário cadastrado; `null` para participante externo (sem
  identidade cadastrada — case ideal para ecoar de volta ao `PUT`).

#### GET /requests/:protocol/internal

Consulta administrativa/interna de uma solicitação pelo protocolo — exige
autenticação (cookie de sessão). Retorna os 4 blocos completos do cadastro
(`requester`, `demand`, `operational`, `complementary`), status, prioridade
(`prioritization.score`/`maxScore`/`label`), responsável, anexos, preferências
de horário e `internalObservations`. Contrato completo e comparação com a
consulta pública (`GET /requests/:protocol`, acima) em
[`docs/requests-internal-query-contract.md`](docs/requests-internal-query-contract.md).

- Resposta `401 Unauthorized`: sem cookie de sessão, ou token inválido/expirado.
- Resposta `403 Forbidden`: `Analista` não-assignee (fora do escopo: só vê atribuídas por triagem ou mapeamento — #102; `Gestor`/`Administrador` sem restrição).
- Resposta `404 Not Found`: protocolo inexistente.

#### PATCH /requests/:protocol/internal

Atualização interna dos blocos editáveis da solicitação pelo protocolo — exige
autenticação (cookie de sessão) e perfil `Analista`, `Gestor` ou
`Administrador`. Corpo: os blocos `requester`, `demand`, `operational` e o
bloco opcional `complementary` (mesmo formato do `GET /requests/:protocol/internal`).
Semântica de **substituição completa**: chave ausente = campo limpo (NULL),
inclusive quando `complementary` é omitido por inteiro.

- Autorização por perfil (issue #121): `Administrador`/`Gestor` editam qualquer
  solicitação; `Analista` apenas as atribuídas a ele (`403` caso contrário).
- `fullName`/`corporateEmail` enviados no `requester` são **ignorados**
  (identidade do solicitante imutável via PATCH interno).
- `last_external_update_at` **não** é alterado; `updated_by` = e-mail do ator
  e `updated_at` renovado. Auditoria `request.update` gravada na mesma
  transação (`audit_history`, `previous_value`/`new_value` = JSON dos blocos).
- Resposta `200 OK`: `RequestInternalDetailDTO` atualizado (mesmo formato do GET
  interno). `desiredDeadline` deve ser hoje ou data futura (`422` caso contrário).
- Erros: `401` sem cookie; `403` perfil não autorizado; `404` protocolo
  inexistente; `422` validação (+ campo `fields` com mensagens por chave, ex.:
  `demand.title`, `operational.hasManualControlsDetail`).

### Triagem de solicitações

Cada triagem é persistida como uma **row versionada** na tabela `triages`
(snapshot normalizado; `triage_id` = uuid do assessment — v2.0, D-N14) e o POST
aplica `status_id`/`category_id` na solicitação. `exitStatus` é o **id
numérico** do status de saída; `newCategory` é o **nome** da categoria de
destino (contrato puro — literais antigos de status não são aceitos). A
proveniência (`occurredAt`/`actor`/`changeOrigin`) vem do `audit_history`
(`request.triage`), correlacionada por `new_value->>'triageId'`.

O `GET /triage` devolve a última row (por `occurred_at` do audit) e o
`GET /internal-notes` devolve o histórico completo em `triages[]`. O campo
`requests.internal_notes` deixou de ser usado pela triagem; o strip defensivo de
`__triage` em `extractInternalObservations` permanece para dados legados.

#### GET /requests/:protocol/triage

Consulta a avaliação de triagem persistida para uma solicitação. Requer autenticação e acesso interno.

- Requer cookie/JWT válido.
- Acesso à rota para `Analista`, `Gestor` e `Administrador`; o service libera `Gestor` (read-only) para leitura, mas restringe `Analista` ao assignee atual — `403` caso contrário (contrato `contract-triage_04.md` §0).
- Resposta `200 OK`: objeto JSON com a avaliação salva, ou `null` quando ainda não existir triagem registrada.

Exemplo de resposta:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440100",
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Baixa complexidade, com integração simples",
  "perceivedRisks": "Risco operacional baixo",
  "suggestedResponsible": "João da Silva",
  "suggestedResponsibleJustification": "Experiência com integrações de ERP",
  "exitStatus": 18,
  "result": "Solicitação elegível para desenvolvimento",
  "conclusionJustification": "O escopo está bem definido e há capacidade operacional para execução."
}
```

> `exitStatus` é o id numérico do `PortalStatus` (`isTriageExit && isActive`); nomes (literais antigos) são rejeitados com `422`.

- Resposta `401 Unauthorized`: sem sessão ou token inválido.
- Resposta `403 Forbidden`: usuário sem acesso à solicitação.
- Resposta `404 Not Found`: protocolo inexistente.

#### POST /requests/:protocol/triage

Cria a triagem da solicitação (append — cada chamada gera uma nova row em
`triages`). A rota insere o snapshot na mesma transação e também atualiza
`status_id` e, quando aplicável, `category_id` da demanda.

- Requer cookie/JWT válido.
- Perfil permitido pela rota: `Administrador` e `Analista`.
- Regra de negócio adicional: somente o `Administrador` ou o Analista assignee (`assignee` triagem) pode executar o registro (`403` caso contrário, contrato `contract-triage_04.md` §0). `Gestor` é read-only e não triagem.
- Cada chamada gera um `id` novo (uuid, não idempotente); a última triagem é a vigente. Auditoria `request.triage` gravada na mesma transação.
- Body: JSON com os campos da avaliação de triagem (sem `id`).

Campos aceitos:

```json
{
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Sim",
  "newCategory": "Dashboard ou relatório",
  "preliminaryComplexity": "Complexidade média, com necessidade de integração externa",
  "perceivedRisks": "Possível impacto em SLA de operação e necessidade de validação de dados",
  "suggestedResponsible": "Maria Souza",
  "suggestedResponsibleJustification": "Equipe com histórico de integrações similares",
  "exitStatus": 18,
  "result": "Aprovado para mapeamento",
  "conclusionJustification": "A solicitação está aderente ao escopo, com riscos conhecidos e categoria ajustada."
}
```

Regras de validação:

- `adherentToScope` obrigatório (`Sim`|`Não`); `changeCategory` obrigatório (`Sim`|`Não`).
- Se `adherentToScope === "Não"`, `adherentJustification` é obrigatório.
- Se `adherentToScope === "Sim"`, `preliminaryComplexity` e `perceivedRisks` são obrigatórios.
- Se `changeCategory === "Sim"`, `newCategory` é obrigatório e deve ser o nome de categoria **ativa**.
- `exitStatus` é obrigatório (id numérico) e deve ser status ativo com `isTriageExit`. Saídas válidas (id — nome): 4 — `Pendente de informações`, 9 — `Elegível`, 18 — `Elegível para avaliação`, 12 — `Backlog`, 13 — `Direcionado para outra área`, 20 — `Direcionada para outra área`, 19 — `Fora do escopo`, 21 — `Duplicada`, 17 — `Cancelado`, 22 — `Cancelada`.
- `result` e `conclusionJustification` são obrigatórios.

Resposta `201 Created`:

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440200",
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Sim",
  "newCategory": "Dashboard ou relatório",
  "preliminaryComplexity": "Complexidade média, com necessidade de integração externa",
  "perceivedRisks": "Possível impacto em SLA de operação e necessidade de validação de dados",
  "suggestedResponsible": "Maria Souza",
  "suggestedResponsibleJustification": "Equipe com histórico de integrações similares",
  "exitStatus": 18,
  "result": "Aprovado para mapeamento",
  "conclusionJustification": "A solicitação está aderente ao escopo, com riscos conhecidos e categoria ajustada."
}
```

- Resposta `400 Bad Request`: payload inválido ou parâmetros fora do esperado.
- Resposta `401 Unauthorized`: sem sessão ou token inválido.
- Resposta `403 Forbidden`: usuário não autorizado para a solicitação.
- Resposta `404 Not Found`: protocolo inexistente.
- Resposta `422 Unprocessable Entity`: erro de validação da triagem, com campos detalhados em `fields`.

### Configuração do portal

Rotas de configuração global (`/portal-config`) — `GET` público consolida
identity/access/theme/assets/categories/statuses/pesos; os `PATCH` por seção
exigem Administrador. Contrato e scripts de teste em
[`docs/portal-config-endpoints.md`](docs/portal-config-endpoints.md).

- `GET /portal-config` — config consolidada (público)
- `PATCH /portal-config/access` — modo de acesso (`PUBLIC`/`AUTHENTICATED`)
  — passa a valer imediatamente nas rotas de solicitação (ver
  [Solicitações](#solicitações))
- `PATCH /portal-config/identity` — nome da plataforma + máscara do protocolo
- `PATCH /portal-config/theme` — tema light/dark completos (atômico)
- `PATCH /portal-config/assets` — assets (multipart; URL direta ou binário)
- `PATCH /portal-config/categories` — categorias (lista atômica)
- `PATCH /portal-config/statuses` — status do ciclo (lista atômica)
- `PATCH /portal-config/prioritization-weights` — pesos 0–10 dos critérios

Toda alteração registrada em `audit_history` (entidade `settings`).

## Scripts

| Comando                               | Descrição                                       |
| ------------------------------------- | ----------------------------------------------- |
| `npm start`                           | Executa o servidor                              |
| `npm run dev`                         | Executa o servidor com reload automático        |
| `npm run docker:dev`                  | Sobe o ambiente Docker (PostgreSQL + app)       |
| `npm run docker:migrate:latest`       | Executa as migrations pendentes no container    |
| `npm run docker:migrate:rollback`     | Desfaz o último lote de migrations no container |
| `npm run docker:migrate:make -- nome` | Cria uma nova migration no container            |
| `npm run docker:seed:run`             | Popula os dados de desenvolvimento no container |
| `npm run docker:seed:scenarios:run`   | Acrescenta cenários opcionais no container      |
| `npm run docker:db:setup`             | Recria o volume e aplica migrations e seeds     |
| `npm run docker:db:reset`             | Remove containers e o volume do banco           |
| `npm run build`                       | Compila o TypeScript para `dist/`               |
| `npm run start:prod`                  | Executa o build gerado                          |
| `npm run typecheck`                   | Checa os tipos com `tsc --noEmit`               |
| `npm run lint`                        | Roda o ESLint                                   |
| `npm run lint:fix`                    | Corrige automaticamente os problemas do ESLint  |
| `npm run format`                      | Formata o código com Prettier                   |
| `npm run format:check`                | Verifica a formatação com Prettier              |
| `npm run migrate:make -- nome`        | Cria uma nova migration                         |
| `npm run migrate:latest`              | Executa as migrations pendentes                 |
| `npm run migrate:rollback`            | Desfaz o último lote de migrations              |
| `npm run seed:run`                    | Popula os dados de desenvolvimento              |
| `npm run seed:scenarios:run`          | Acrescenta cenários opcionais de teste/demo     |
| `npm run db:setup`                    | Aplica migrations e seeds em sequência          |
| `npm test`                            | Executa os testes                               |

## Estrutura do Projeto

```text
src/
├── app.ts                  # Configuração da aplicação Express e middlewares globais
├── server.ts               # Ponto de entrada e inicialização do servidor HTTP
├── modules/                # Módulos de domínio da aplicação
└── shared/                 # Código e recursos compartilhados
    ├── errors/
    │   └── AppError.ts     # Classe padronizada para erros operacionais de negócio
    ├── middleware/
    │   ├── auth.ts         # Middleware de validação do token JWT (rotas protegidas)
    │   └── errorHandler.ts # Middleware de captura e resposta global de erros
    ├── types/
    │   ├── express.d.ts    # Extensão da tipagem nativa do Express (ex: req.user)
    │   └── role.ts         # Enum de perfis de usuário (Analista, Gestor, Administrador)
    └── utils/
        └── jwtUtil.ts      # Geração e validação de tokens JWT assinados
```
