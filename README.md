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

## Endpoints

### Autenticação

#### POST /auth/login

Autentica o usuário com e-mail e senha. Em caso de sucesso, retorna os dados do usuário (sem a senha) e define um cookie de sessão HttpOnly com o token JWT.

- Body: `{ "email": "maria@instituicao.gov.br", "password": "123456" }`
- Resposta `200 OK`:
  ```json
  {
    "id": "1",
    "s": "maria@instituicao.gov.br",
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
