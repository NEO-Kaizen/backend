# Neo Kaizen — Backend

Esqueleto inicial do backend do projeto Neo Kaizen.

## Requisitos

- Node.js 20+ (recomendado: LTS mais recente)
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

## Banco de dados

O projeto utiliza PostgreSQL como banco de dados e Knex para gerenciamento das migrations.

As variáveis necessárias para conexão estão documentadas no arquivo `.env.example`.

A documentação da persistência utilizada para autenticação está disponível em:

- [Persistência para autenticação](docs/database/authentication-persistence.md)

As migrations podem ser executadas após a configuração das credenciais do banco:

```bash
npm run migrate:latest
```

Para desfazer o último lote de migrations:

```bash
npm run migrate:rollback
```

Após a execução das migrations, os dados iniciais podem ser carregados com:

```bash
npm run seed:run
```

Para criar um novo arquivo de seed:

```bash
npm run seed:make -- seed-name
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

## Scripts

| Comando                        | Descrição                                      |
| ------------------------------ | ---------------------------------------------- |
| `npm start`                    | Executa o servidor                             |
| `npm run dev`                  | Executa o servidor com reload automático       |
| `npm run build`                | Compila o TypeScript para `dist/`              |
| `npm run start:prod`           | Executa o build gerado                         |
| `npm run typecheck`            | Checa os tipos com `tsc --noEmit`              |
| `npm run lint`                 | Roda o ESLint                                  |
| `npm run lint:fix`             | Corrige automaticamente os problemas do ESLint |
| `npm run format`               | Formata o código com Prettier                  |
| `npm run format:check`         | Verifica a formatação com Prettier             |
| `npm run migrate:make -- nome` | Cria uma nova migration                        |
| `npm run migrate:latest`       | Executa as migrations pendentes                |
| `npm run migrate:rollback`     | Desfaz o último lote de migrations             |
| `npm run seed:make -- nome`    | Cria um novo arquivo de seed                   |
| `npm run seed:run`             | Executa os seeds configurados                  |
| `npm test`                     | Executa os testes                              |

## Estrutura

```text
src/
  app.ts      # Configuração da aplicação Express
  server.ts   # Inicialização do servidor
```
