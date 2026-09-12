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

A documentação da persistência utilizada para autenticação e para os pedidos está disponível em:

- [Persistência para autenticação](docs/database/authentication-persistence.md)
- [Persistência dos pedidos (solicitações)](docs/database/requests-persistence.md)

As migrations e os seeds podem ser executados após a configuração das credenciais do banco:

```bash
npm run migrate:latest   # aplica as migrations pendentes
npm run seed:run         # popula os dados de desenvolvimento
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
    "role": "Analista"
  }
  ```

- Resposta `400 Bad Request`: e-mail ou senha ausentes.
- Resposta `401 Unauthorized`: credenciais inválidas (e-mail não encontrado ou senha incorreta).

#### POST /auth/logout

Encerra a sessão do usuário autenticado, removendo o cookie de sessão do navegador. O endpoint é idempotente — retorna sucesso mesmo quando não há sessão ativa.

- Body: nenhum
- Resposta `200 OK`:

  ```json
  { "message": "Sessão encerrada com sucesso" }
  ```

### Solicitações

#### POST /requests

Endpoint público (sem autenticação) que cadastra uma solicitação, gera o protocolo e persiste os blocos do formulário, as preferências de horário e os anexos.

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

Endpoint público (sem autenticação) que lista as solicitações vinculadas ao e-mail de um solicitante, com dados resumidos. O e-mail informado é normalizado para minúsculas antes da consulta.

- Query: `?email=maria.oliveira@instituicao.gov.br` (obrigatório)
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

Consulta pública da solicitação pelo protocolo de rastreio (acompanhamento sem autenticação).

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
