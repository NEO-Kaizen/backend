# feat(requests): implement internal request update via PATCH

## Resumo

Implementa o endpoint `PATCH /requests/:protocol/internal`, contraparte de
escrita do `GET /requests/:protocol/internal` (issue #48), usado pelo modo de
edição inline da tela de especificação (`/(admin)/fila/[protocolo]`). Permite
atualizar os 4 blocos editáveis da solicitação (`requester`, `demand`,
`operational` e `complementary` opcional) com validação Zod, persistência
transacional, auditoria `request.update` e resposta no mesmo formato do GET
interno.

O contrato de atualização (`contract-request-update.md`), inicialmente uma
proposta com questões em aberto, foi consolidado com as decisões do alinhamento
com o Frontend (método/caminho, resposta `200`, formato do `422` com chaves da
UI, `fullName`/`corporateEmail` ignorados e autorização por perfil completa —
issue #121).

## Alterações realizadas

- cria o DTO `UpdateInternalRequestPayload` (blocos reutilizados do GET) e o
  bloco `UpdateRequesterBlock`;
- adiciona `updateRequestPayloadSchema` no Zod, incluindo a regra nova
  `desiredDeadline` hoje ou futura (somente no PATCH) e o tratamento silencioso
  de `fullName`/`corporateEmail`;
- adiciona `buildZodFieldErrors` com mapa `UI_FIELD_KEYS` — traduz o caminho
  Zod para a chave usada pela interface (ex.:
  `operational.hasManualControls` → `operational.hasManualControlsDetail`);
- cria `ValidationError` (422) e estende o `errorHandler` para incluir o campo
  `fields` no envelope padrão, de forma retrocompatível;
- cataloga o evento `request.update` no `auditCatalog`;
- adiciona no repositório `findProfessionalByUserId`, `updateRequestBlocks` e
  `updateRequesterEditable` (substituição completa: chave ausente = campo
  limpo/NULL; `last_external_update_at` intocado);
- cria `updateInternalRequest` no service com autorização da issue #121
  (Administrador/Gestor editam qualquer; Analista apenas as atribuídas a ele),
  transação + auditoria (`previousValue`/`newValue` = JSON dos blocos,
  `changeOrigin: 'admin'`);
- completa a rota no router (o esqueleto já existia) com `authMiddleware` +
  `requireRole("Analista","Gestor","Administrador")`;
- documenta o endpoint no `README.md` e consolida o contrato,
  a issue e o plano de execução com as evidências dos testes manuais.

## Issue relacionada

Issue principal: #88

Issues relacionadas:

- #121
- #48

## Escopo não incluído

- `PUT /requests/:protocol` (fluxo público/solicitante de edição) — fora do
  escopo desta tarefa;
- `GET /audit/:protocol` (histórico de auditoria) — validação via `audit_history`
  no banco;
- testes automatizados (Vitest/Supertest) — o projeto adota testes manuais
  neste momento;
- templates locais não versionados (`padrao-issues.md`, `padrao-pr.md`,
  `docs/database/identifier-patterns.md`) e arquivos de outros módulos
  (prioritization) com pendências de formatação pré-existentes.

## Como validar

1. Execute a API: `npm run start` (PostgreSQL via Docker: `docker compose up -d postgres`).
2. Faça login com `POST /auth/login` usando um usuário de seed
   (`administrador_teste@email.com`, `gestor_teste@email.com` ou
   `roberta.analista@email.com`, senha `steste123`) e capture o cookie `session_id`.
3. Envie `PATCH /requests/MAAT-8K3P-9X2M/internal` com os 4 blocos do GET
   interno (`GET /requests/:protocol/internal`) ajustados — espere `200` com o
   `RequestInternalDetailDTO` atualizado.
4. Valide os erros: sem cookie (`401`), perfil `Solicitante` (`403`), protocolo
   inexistente (`404`), e payloads inválidos (`422` com `fields` — ex.:
   `demand.title`, `operational.peopleInvolved`, `operational.desiredDeadline`
   no passado, `operational.hasManualControlsDetail`).
5. Valide a autorização #121: Analista obtém `403` em solicitação não atribuída
   a ele e `200` em atribuída; Gestor/Admin editam qualquer.
6. Confirme persistência: `updated_at` renovado, `updated_by` = e-mail do ator,
   `last_external_update_at` inalterado; chaves ausentes viram `NULL` no banco.
7. Confirme a auditoria via SQL no container:
   `SELECT * FROM audit_history WHERE entity_type='request' AND entity_id='MAAT-8K3P-9X2M'`
   — eventos `request.update` com `previous_value`/`new_value` (JSON dos blocos)
   e `change_origin = 'admin'`.
8. Execute `npm run typecheck` e `npm run lint` (limpos).
   `npm run format:check` exibe apenas avisos pré-existentes fora do escopo
   desta entrega.

## Evidências

- Roteiro de testes manuais com resultados 1–18:
  [`plano-execucao-update-request-internal.md`](./plano-execucao-update-request-internal.md)
  (tabela de resultados na seção 11);
- Contrato consolidado/FECHADO:
  [`contract-request-update.md`](./contract-request-update.md);
- Issue com critérios de aceite marcados e decisões registradas:
  [`issue-backend-update-request-internal.md`](./issue-backend-update-request-internal.md);
- Respostas da API e consultas SQL capturadas durante a execução dos cenários
  1–18 (2026-09-18);
- `npm run typecheck` e `npm run lint` sem erros.

## Impactos, dependências e limitações

- Mudança de contrato com o time de Frontend: o corpo do `422` passa a incluir
  o campo `fields` (chaves da UI) — envelope `{ status, statusCode, message }`
  mantido para demais erros.
- A rota do PATCH já existia como esqueleto no router; a partir desta entrega
  passa a responder.
- `requesters` pode ser compartilhado entre solicitações (deduplicado por
  e-mail): a atualização afeta o registro comum
  (área/departamento/gestor/contato).
- `GET /audit/:protocol` ainda não existe; a verificação de auditoria é feita
  diretamente em `audit_history`.
- Nenhuma migration nova — sem dependência de banco.

## Checklist do autor

- [x] Revisei minhas próprias alterações.
- [x] A alteração atende aos critérios de aceite.
- [x] O PR está limitado ao escopo da Issue.
- [x] Removi arquivos, logs e comentários temporários.
- [x] Executei as validações disponíveis.
- [x] Adicionei evidências quando aplicável.
- [x] Atualizei a documentação necessária.
- [x] Não incluí credenciais, dados sensíveis ou informações restritas.
- [x] O PR está pronto para revisão.