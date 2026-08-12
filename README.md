# Neo Kaizen — Backend

Esqueleto inicial do backend do projeto Neo Kaizen.

## Requisitos

- Node.js 24+ (recomendado: LTS mais recente)
- npm 9+

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

## Execução

```bash
npm start
```

Em modo desenvolvimento, com reload automático:

```bash
npm run dev
```

O servidor roda em `http://localhost:3000` (ou na porta definida em `PORT`).

## Deploy com Docker

### Requisitos na máquina (host)

- Docker Engine + Docker Compose plugin (versão recente).
- Repositório clonado (necessário para o serviço de desenvolvimento `api-dev`, que faz bind-mount de `./src`).
- Arquivo `.env` criado a partir de `.env.example`.

### Serviços

| Serviço   | Porta | Uso                                                                  |
| --------- | ----- | -------------------------------------------------------------------- |
| `api`     | 3000  | Container de produção: roda `dist/` com `NODE_ENV=production`        |
| `api-dev` | 3001  | Container de desenvolvimento: roda `src/` com hot reload (`--watch`) |

Ambos os serviços usam a mesma imagem construída a partir do `Dockerfile` multi-stage
(base `node:24-bookworm-slim`, usuário não-root `node`, sem segredos na imagem).

### Build e execução

```bash
# Construir a imagem (necessário quando package.json/Dockerfile mudam)
docker compose build

# Produção
docker compose up -d api

# Desenvolvimento (hot reload)
docker compose up -d api-dev

# Logs
docker compose logs -f api
docker compose logs -f api-dev
```

Verificação de saúde do serviço de produção:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Endurecimento de segurança aplicado aos containers

- Usuário não-root (`user: node`), sem privilégios elevados.
- `cap_drop: ALL` e `no-new-privileges` — sem capabilities extras do kernel.
- Sistema de arquivos raiz read-only (`read_only`) com `tmpfs` apenas em `/tmp`.
- `init: true` — encerramento correto de processos filhos (sem processos zumbi).
- Limites de recursos: `cpus: 1.0` e `mem_limit: 512m`.
- Portas não-privilegiadas e exposição apenas do necessário.
- Variáveis sensíveis (ex.: `JWT_SECRET`) somente via `.env` no host — nunca na imagem nem no repositório.

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

## Scripts

| Comando                | Descrição                                      |
| ---------------------- | ---------------------------------------------- |
| `npm start`            | Executa o servidor                             |
| `npm run dev`          | Executa o servidor com reload automático       |
| `npm run build`        | Compila o TypeScript para `dist/`              |
| `npm run start:prod`   | Executa o build gerado                         |
| `npm run typecheck`    | Checa os tipos com `tsc --noEmit`              |
| `npm run lint`         | Roda o ESLint                                  |
| `npm run lint:fix`     | Corrige automaticamente os problemas do ESLint |
| `npm run format`       | Formata o código com Prettier                  |
| `npm run format:check` | Verifica a formatação com Prettier             |
| `npm test`             | Executa os testes                              |

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
