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

| Variável         | Descrição                                                           | Exemplo / Padrão        |
| ---------------- | ------------------------------------------------------------------- | ----------------------- |
| `PORT`           | Porta do servidor HTTP                                              | `3000`                  |
| `JWT_SECRET`     | Chave secreta usada para assinar e validar os tokens JWT            | `sua-chave-secreta`     |
| `JWT_EXPIRES_IN` | Tempo de expiração dos tokens gerados                               | `1d`                    |
| `NODE_ENV`       | Ambiente de execução (`development`, `production`)                  | `development`           |
| `CORS_ORIGINS`   | Origens permitidas para requisições cross-origin, separadas por `,` | `http://localhost:5173` |
| `COOKIE_NAME`    | Nome do cookie de sessão de autenticação                            | `session_id`            |

## Rodando com Docker

O ambiente completo (PostgreSQL + aplicação) sobe com um único comando, sem precisar instalar Node ou PostgreSQL na máquina:

```bash
cp .env.example .env
npm run docker:dev
```

O `docker compose up` inicia o PostgreSQL (aguardando o health check) e a aplicação com hot-reload via `--watch`. As variáveis do `.env` são usadas pelos containers; dentro da rede do compose o `DB_HOST` é sobrescrito para o serviço `postgres`, enquanto o fluxo local usa o `localhost` do `.env`.

Para rodar as migrations no container (com o ambiente no ar):

```bash
npm run docker:migrate:latest
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

- O PostgreSQL é publicado apenas em loopback (`127.0.0.1`), na porta definida por `POSTGRES_HOST_PORT` (padrão `5432`). Se essa porta já estiver ocupada no host, defina `POSTGRES_HOST_PORT` no `.env`.
- Os dados do PostgreSQL persistem no volume `postgres_data` entre `docker compose down` e `up`; use `docker compose down -v` para apagá-los.
- As credenciais do banco (`POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`, derivadas do `.env`) só inicializam o banco quando o volume está vazio. Alterá-las depois da primeira inicialização não muda o usuário e o banco existentes: recrie o ambiente com `docker compose down -v` (apaga os dados) ou ajuste as credenciais diretamente no banco.
- As imagens base estão fixadas por digest (`node:24-bookworm-slim` e `postgres:18-alpine`); atualize os digests periodicamente para receber correções de segurança.

## Banco de dados

O projeto utiliza PostgreSQL como banco de dados e Knex para gerenciamento das migrations.

As variáveis necessárias para conexão estão documentadas no arquivo `.env.example`.

A documentação da persistência utilizada para autenticação está disponível em:

- [Persistência para autenticação](docs/database/authentication-persistence.md)

As migrations podem ser executadas após a configuração das credenciais do banco:

```bash
npm run migrate:latest
```

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
    "role": "Solicitante"
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

## Scripts

| Comando                               | Descrição                                       |
| ------------------------------------- | ----------------------------------------------- |
| `npm start`                           | Executa o servidor                              |
| `npm run dev`                         | Executa o servidor com reload automático        |
| `npm run docker:dev`                  | Sobe o ambiente Docker (PostgreSQL + app)       |
| `npm run docker:migrate:latest`       | Executa as migrations pendentes no container    |
| `npm run docker:migrate:rollback`     | Desfaz o último lote de migrations no container |
| `npm run docker:migrate:make -- nome` | Cria uma nova migration no container            |
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
    │   └── role.ts         # Enum de perfis de usuário (Solicitante, Analista, Gestor, Administrador)
    └── utils/
        └── jwtUtil.ts      # Geração e validação de tokens JWT assinados
```
