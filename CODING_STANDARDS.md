# Padrões de código — backend

Este documento define **como escrever código** neste repositório. Ele não redefine contrato HTTP, schema ou decisões de produto: aponta para o documento dono de cada assunto.

**Contexto:** Node.js 24+, ESM, TypeScript, Express 5, Knex/PostgreSQL e Zod. O build usa `tsc`; os scripts, o lint e a formatação vivem em `package.json`, `tsconfig.json`, `eslint.config.js` e `.prettierrc`.

## Como usar

| Vou…                                               | Leia                                  |
| -------------------------------------------------- | ------------------------------------- |
| escrever ou alterar rota, controller ou middleware | §5 e §7; contrato em `docs/`          |
| escrever service ou regra de domínio               | §4 e §5                               |
| escrever repository, query ou migration            | §6; persistência em `docs/database/`  |
| escrever teste                                     | §10; decisão pendente na issue #135   |
| revisar um PR                                      | §11; skill `pr` e skill `code-review` |
| mexer em erro ou envelope                          | §5; issue #132                        |
| mexer em tipagem                                   | §3; issue #133                        |

**Linguagem normativa:** **Sempre** = obrigatório; **Prefira** = default; **Nunca** = guardrail.

**Critério de conclusão:** `npm run check` passa, os documentos de contrato afetados foram atualizados e o checklist §11 está completo. Quando a suíte existir, `npm test` também precisa passar.

## Vocabulário

- **Borda**: onde dados externos entram — HTTP, banco, upload. Tudo que vem da borda é `unknown` até validação.
- **Domínio**: regra de negócio pura, sem HTTP, banco ou framework.
- **Controller/handler**: recebe a requisição, valida a entrada, chama o service e responde.
- **Service**: concentra a regra de negócio e orquestra repositories.
- **Repository**: concentra as queries e o acesso ao banco.

## 1. Nomenclatura e arquivos

**Sempre** nomeie pela intenção: o nome diz o que o código garante, não como foi escrito.

- `camelCase` para variáveis e funções; `PascalCase` para tipos e classes; `UPPER_SNAKE_CASE` para constantes de módulo.
- Módulos seguem `<módulo>.<papel>.ts`: `requests.controller.ts`, `requests.service.ts`, `requests.repository.ts`, `requests.schema.ts`, `requests.router.ts`.
- DTOs ficam em `src/modules/DTOs/<módulo>/` e usam `PascalCase`, por exemplo `PendingItems.dto.ts`.
- Migrations e seeds usam `timestamp_snake_case.js`; migrations podem ficar em subdiretórios por domínio.
- Booleanos começam com `is`, `has`, `can` ou `should`; funções começam com um verbo.
- Use o termo do `GLOSSARY.md`. Se o conceito ainda não existe lá, resolva o vocabulário antes de nomear.
- Evite `data`, `item`, `temp`, `manager`, `helper` e abreviações que não sejam universais.
- Extraia números e strings mágicos para constantes nomeadas.
- Nome ruim se conserta renomeando, não comentando.

## 2. Módulos e imports

**Sempre** use ESM e imports que o Node 24 executa sem transpilação.

- Extensão `.ts` em imports relativos (`./users.service.ts`).
- `import type` / `export type` para tipos.
- Exports nomeados; use default export só quando a ferramenta exigir (o `app`, o `db` e o `Config` atuais são exceções).
- Prefixo `node:` em builtins (`node:crypto`, `node:path`, `node:fs`).
- `import.meta.dirname` no lugar de `__dirname`; `require` e `module.exports` ficam fora de código novo.
- Prefira import direto a `import * as` quando só alguns símbolos são usados.
- Mantenha o grafo de imports acíclico; se dois módulos precisam do mesmo contrato, extraia para `src/shared/`.
- Código transversal fica em `src/shared/`; código específico de um domínio fica no módulo.

## 3. Tipos

**Sempre** trate dados da borda como `unknown` até a validação. **Nunca** use `any` em código de aplicação.

- Estreite com type guards ou schema; use `satisfies` para checar shape sem alargar o tipo.
- Modele variantes com união discriminada; prefira uniões e `as const` a `enum`/`namespace`.
- Marque dados imutáveis como `readonly` quando isso ajudar o leitor.
- Use `as` só depois de validação ou em fronteira documentada; prefira guard ou `satisfies`.
- Trate o caso ausente em vez de usar `!`.
- Declare retorno explícito em APIs públicas.
- `catch (err)` é `unknown`; não acesse `err.message` direto.
- Conversões de linha do banco (`Record<string, unknown>`) devem ser concentradas no repository e validadas antes de virar DTO.
- A dívida de tipagem está na issue #133; novas alterações não devem aumentá-la.

## 4. Funções e assincronismo

**Sempre** mantenha uma responsabilidade por função, retorno cedo e efeitos explícitos.

- Domínio puro: sem HTTP, banco, `Date.now()` ou `Math.random()` quando isso puder ser injetado.
- Prefira funções separadas ou um objeto de opções a parâmetro booleano de controle.
- Toda promise é `await`ed, retornada ou tratada. Se a promise for intencionalmente solta, marque `void` e garanta o `catch` dentro dela.
- Use `Promise.all` para operações independentes; limite a concorrência de chamadas externas.
- Use `for...of` ou `Promise.all(map)` em vez de callback `async` em `forEach`.
- Toda chamada externa tem timeout; não use `Promise.race` sozinho para cancelar trabalho.
- Trabalho síncrono pesado (`readFileSync`, CPU-bound, criptografia síncrona) não entra no caminho da requisição.
- Configuração é lida no boot. `process.env` deve ficar em `src/configs.ts` ou no bootstrap do banco, não espalhado pelos módulos.

## 5. Erros e envelope

**Sempre** lance `Error` ou subclasse. **Nunca** lance string, objeto ou `unknown`.

- `AppError(message, statusCode, code?)` é o erro base (`src/shared/errors/AppError.ts`).
- `ValidationError(fields, message, code?)` responde `422` com erros por campo (`src/shared/errors/ValidationError.ts`).
- O envelope é `{ status: "error", statusCode, message, code?, fields? }`; use `errorHandler` em vez de montar o JSON na mão.
- `catch` recebe `unknown`; estreite com `instanceof AppError`/`ValidationError` e deixe o resto subir.
- A causa é logada uma vez, na borda; camadas internas deixam o erro subir.
- `code` é estável em `snake_case` e não é traduzido; `message` é em português.
- Nunca devolva stack, SQL, path, nome de tabela ou detalhe interno em `5xx`.
- 4xx de validação usa `formatZodIssues` ou `buildZodFieldErrors` (`src/shared/validation/zodErrors.ts`).
- Use exceção para condição excepcional; validação de entrada responde `400`/`422`.

## 6. Validação e persistência

**Sempre** valide na borda antes de usar o dado.

### 6.1 Validação

- `params`, `query`, `body` e headers relevantes passam por schema Zod no controller.
- Use `safeParse`; em caso de falha, encaminhe `formatZodIssues`/`buildZodFieldErrors` com `AppError`/`ValidationError`.
- Mensagens de validação são em português e orientam o usuário.
- Normalize antes de comparar; o body cru não vira input do domínio por spread.
- Em PATCH, diferencie campo ausente de `undefined`/`null` conforme o contrato.
- Uploads validam tamanho, MIME declarado e, quando aplicável, conteúdo; limites vivem nos middlewares de upload.

### 6.2 Persistência

- Knex é o acesso ao banco (`src/database/conection.ts`). Values usam bindings (`?`/`$1`); nunca interpole entrada em SQL.
- Repositories recebem e devolvem tipos claros; não vaze `Record<string, unknown>` para o controller sem normalização.
- Transações usam a forma handler (`db.transaction(async (trx) => …)`) e não fazem I/O externo dentro da transação.
- Operações que gravam auditoria usam `recordAudit(trx, ...)` na mesma transação (`src/shared/audit/auditLogger.ts`).
- Toda listagem tem limite e paginação quando o contrato pedir.
- Resolva N+1 com `whereIn`, join ou consulta agrupada; `Promise.all` por linha continua sendo N round trips.
- Erro do driver vira `AppError` na borda; não vaze SQL nem nome de tabela.

### 6.3 Migrations e seeds

- Nunca edite uma migration já aplicada; crie outra.
- Toda migration tem `up` e `down` reversível.
- Seeds devem ser idempotentes e não apagar dados fora do escopo que criam.
- Alteração de schema atualiza a documentação correspondente em `docs/database/` no mesmo PR.
- O histórico de auditoria é append-only; não o atualize nem apague fora de um bypass controlado de seed.

## 7. Express e camadas

**Sempre** mantenha o controller fino: valide a entrada, chame o service e responda.

- Router só monta rotas e middlewares; controller orquestra; service concentra regra; repository concentra query.
- Express 5 encaminha rejeição async para o error handler; callbacks e eventos fora da cadeia precisam de `try/catch` e `next(err)`.
- O error handler fica por último em `src/app.ts`.
- Tipar handlers evita `any`: `Request`, `Response`, `NextFunction` e tipos de DTO.
- `req.query` é read-only no Express 5; valide os valores como `string | string[] | ParsedQs`.
- Use `res.status(...).json(...)` e responda uma vez.
- Autenticação: `authMiddleware` (`src/shared/middleware/auth.ts`) valida o cookie JWT e resolve o perfil no banco.
- Autorização: `requireRole(...)` para perfis e `requireAccessMode()` para o modo de acesso do portal. O papel vem do banco, nunca do JWT.
- Rotas de solicitante usam `requesterDualAuth` quando aceitam sessão ou identidade pública.
- Não confie em role/ID enviado pelo cliente; autorize no servidor em toda operação sobre recurso.
- CORS não é controle de acesso.

## 8. Segurança

**Sempre** proteja segredos, entrada e autorização.

- Segredo só via configuração validada; nunca hardcode, logue, devolva em erro ou use em fixture.
- `.env` e `.context7API` não entram no Git, no log nem na resposta.
- Não use `eval`, `new Function` ou `vm` com input; não use `exec` com interpolação.
- Upload: valide tamanho, MIME e conteúdo; gere nome de armazenamento seguro; não sirva SVG executável.
- Cookies de sessão: `HttpOnly`, `SameSite` e `Secure` em produção.
- Rate limit em rotas públicas sensíveis (`src/shared/middleware/rateLimit.ts`).
- PII não entra em log, erro, fixture ou resposta desnecessária.
- Mensagens de erro não revelam existência de e-mail, protocolo ou recurso de terceiros.

## 9. Contratos e documentação

- O contrato HTTP vive em `docs/*.md`; o código consome o contrato, não o redefine no handler.
- Alteração de rota, payload, resposta ou status code atualiza o documento correspondente no mesmo PR.
- Exemplos de contrato não contêm PII.
- Decisões de arquitetura que sejam difíceis de reverter viram ADR em `docs/adr/`.
- Use o vocabulário do `GLOSSARY.md` em títulos, mensagens e documentos.

## 10. Testes

**Sempre** teste comportamento, não implementação.

- A suíte ainda não está configurada; a decisão de runner e harness está na issue #135.
- Enquanto a suíte não existir, valide manualmente os caminhos felizes e de erro e registre as evidências no PR.
- Quando a suíte entrar, prefira `node:test` + `node:assert/strict` + `fetch` se a decisão da issue #135 confirmar essa stack.
- Injete clock, ID e RNG quando o comportamento depender deles.
- Sem `sleep`; use fake timers do runner e aguarde sinais/promessas.
- Unit sem I/O; integração nas fronteiras (HTTP, banco, fila).
- Cubra caminhos de erro e regras de negócio; cobertura é consequência, não meta.

## 11. Checklist de code review

- [ ] Nomes revelam intenção; termos do `GLOSSARY.md`.
- [ ] Sem `any`; `unknown` na borda; sem assertion sem validação.
- [ ] Funções pequenas, retorno cedo, sem trabalho síncrono pesado.
- [ ] Promises tratadas; sem floating promise; timeouts em chamadas externas.
- [ ] Erros tipados; sem swallow; sem stack/SQL/PII na resposta.
- [ ] Entrada validada; SQL parametrizado; autorização no servidor.
- [ ] Upload valida conteúdo e limites; cookie/CSRF revisados quando aplicável.
- [ ] Sem segredo/PII em código, log ou fixture; sem `eval`/`exec` com input.
- [ ] Migrations reversíveis e seeds idempotentes; documentação de schema atualizada.
- [ ] Contrato HTTP e exemplos atualizados no mesmo PR.
- [ ] Comentários explicam o porquê; sem código morto.
- [ ] Dependência nova justificada; a stdlib não foi reimplementada por pacote.
- [ ] `npm run check` e `npm test` (quando existir) verdes.
- [ ] Exceções a este documento registradas no PR.

## Referências

- Node.js — [ESM](https://nodejs.org/docs/latest-v24.x/api/esm.html) · [Type stripping](https://nodejs.org/docs/latest-v24.x/api/typescript.html) · [Test runner](https://nodejs.org/docs/latest-v24.x/api/test.html)
- TypeScript — [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) · [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- Express — [Error handling](https://expressjs.com/en/guide/error-handling.html) · [Migrating 5](https://expressjs.com/en/guide/migrating-5.html)
- Zod — [Documentation](https://zod.dev/)
- Knex — [Transactions](https://knexjs.org/guide/transactions.html) · [Query builder](https://knexjs.org/guide/query-builder.html)
- PostgreSQL — [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- OWASP — [Node.js Security](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) · [File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
