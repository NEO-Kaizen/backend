# BACKEND — Restringir a fila centralizada às solicitações do analista

## Contexto

Hoje `GET /queue` e `GET /queue/metrics` retornam todas as solicitações para qualquer
perfil interno. O Analista deveria enxergar apenas as solicitações sob sua
responsabilidade, evitando acesso a demandas de terceiros.

## Objetivo

Fazer com que o Analista veja, na fila centralizada, apenas as solicitações em que é
responsável de triagem ou de mapeamento. Gestor e Administrador continuam sem restrição.

## Escopo

### Incluído

- Filtrar `GET /queue` pelo escopo quando o perfil for Analista.
- Filtrar `GET /queue/metrics` pelo mesmo escopo.
- Escopo = responsável de triagem **ou** de mapeamento, identificado pelo `user_id` do
  responsável (mesmo identificador já usado pelo frontend na fila).
- Solicitações sem responsável não aparecem para o Analista.
- Gestor e Administrador permanecem com visão total.

### Não incluído

- Alterações de frontend.
- Restringir `GET`/`PUT /queue/requests/:protocol/mapping`.
- Novos filtros ou parâmetros de API.

## Entregável

Endpoints da fila aplicando o escopo por perfil no backend.

## Critérios de aceite

- [ ] Analista vê apenas solicitações em que é responsável de triagem ou de mapeamento.
- [ ] Solicitações sem responsável não aparecem para o Analista.
- [ ] `GET /queue/metrics` do Analista reflete apenas esse conjunto.
- [ ] Gestor e Administrador continuam vendo todas as solicitações.
- [ ] O escopo é aplicado no servidor, sem depender de parâmetro do cliente.
- [ ] Paginação e `total` coerentes com o conjunto filtrado.
- [ ] Typecheck/lint passam.

## Dependências

- Nenhuma dependência conhecida.

## Referências

- `src/modules/queue/queue.router.ts`
- `src/modules/queue/queue.service.ts`
- `src/modules/queue/queue.repository.ts`
- `src/modules/queue/mapping.repository.ts` (responsável de mapeamento)
- `docs/requests-internal-query-contract.md`
- `docs/requests-assignment-contract.md`

## Evidências esperadas

- Requisição e resposta de `GET /queue` com perfil Analista (apenas as próprias).
- Requisição e resposta de `GET /queue/metrics` com perfil Analista.
- Requisição e resposta com Gestor e Administrador (visão total).
- Saída de `npm run check`.

## Observações

- O contrato de resposta não muda; apenas o conjunto retornado.
- O escopo é resolvido por `user_id` do responsável; `professional_id` não é exposto nem
  recebido pela API.
- Número da issue no nome do arquivo é provisório (último mergeado: #101).
