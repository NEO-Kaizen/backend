# OpenAPI como fonte única do contrato HTTP

**Status:** aceito — 21/11/2026

O contrato HTTP deste backend passa a viver **exclusivamente** na especificação
OpenAPI 3.0.1 em `src/docs/` (`paths/`, `schemas/`, `components/`), servida em
`GET /api-docs` em desenvolvimento e materializada em `docs/openapi.json`.
Documentos em `docs/` não definem mais **normativamente** rota, payload,
resposta, enum ou status code: eles guardam regras de negócio (`docs/rules/`),
decisões (`docs/adr/`), persistência (`docs/database/`) e operação
(`docs/ci.md`).

## Contexto

Havia 18 documentos de contrato em `docs/` (~6,4 mil linhas) repetindo rotas
e shapes. As cópias divergiam entre si e do código, e o próprio repositório se
contradizia: o `README` já dizia que a OpenAPI era exclusiva, enquanto
`CODING_STANDARDS.md` mandava documentar o contrato em `docs/*.md`.

## Alternativas consideradas

- **Manter os `.md` como contrato e a OpenAPI como cópia:** perpetuaria a
  divergência e o custo de sincronização manual.
- **Gerar os `.md` a partir da OpenAPI:** resolveria a duplicação de formato,
  mas ainda manteria dois artefatos para o mesmo conteúdo, sem lugar claro para
  as regras de negócio.
- **Derivar toda a OpenAPI dos schemas Zod:** reduziria a duplicação
  request/validação, mas exige um refactor transversal (inclusive respostas, que
  hoje são DTOs TypeScript). Fica como evolução possível; a prioridade é ter uma
  única fonte normativa agora.

## Consequências

- `npm run docs:openapi:check` valida a spec, resolve `$ref`s, exige
  `summary`/`description`/`operationId`/`tags`/`responses` e compara **todas** as
  rotas reais do Express com as documentadas. Roda dentro de `npm run check`.
- `docs/openapi.json` é gerado e versionado; o check falha se estiver
  desatualizado. O frontend pode consumi-lo sem subir o backend.
- Mudança de contrato é mudança em `src/docs/` no mesmo PR. Regra de negócio
  nova vai para `docs/rules/`; decisão difícil de reverter vai para ADR.
- A especificação continua **não publicada em produção** (`SWAGGER_ENABLED`);
  o artefato versionado é o contrato público.
- Enquanto a validação de request continuar em Zod, a paridade campo a campo
  entre Zod e OpenAPI é responsabilidade do PR (o check garante rotas e
  estrutura, não a semântica de cada campo).
- Documentos de contrato antigos foram removidos; o mapa está em
  [`docs/superseded.md`](../superseded.md).
