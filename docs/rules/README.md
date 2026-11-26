# Regras de negócio

Este diretório guarda **o que o domínio decide** — lifecycle, autorização de
domínio, estados, cálculos e invariantes. O **formato do fio** (rotas, payloads,
respostas, enums e códigos de erro) vive exclusivamente na especificação
OpenAPI em [`src/docs/`](../../src/docs/), servida em `GET /api-docs` em
desenvolvimento.

## Precedência

1. **Contrato HTTP:** `src/docs/` + `docs/openapi.json`.
2. **Regra de negócio:** `docs/rules/` (este diretório).
3. **Decisão difícil de reverter:** `docs/adr/`.
4. **Persistência:** `docs/database/`.
5. **Vocabulário:** `GLOSSARY.md`.

Quando um documento de regra e a OpenAPI divergirem sobre **formato**, vale a
OpenAPI. Quando divergirem sobre **comportamento**, vale este diretório — e a
OpenAPI deve ser corrigida se descrever o comportamento errado.

## Índice

| Documento                                              | Cobre                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| [`requests-lifecycle.md`](requests-lifecycle.md)       | Ciclo de vida da solicitação, catálogo de Status e transições    |
| [`triage.md`](triage.md)                               | Triagem sequencial, campos condicionais e status de saída        |
| [`assignment.md`](assignment.md)                       | Responsável de triagem, designado de mapeamento e RN-010         |
| [`pending-items.md`](pending-items.md)                 | Pendências por campo, respostas, revisão e anexos                |
| [`internal-observations.md`](internal-observations.md) | Linha do tempo de notas/eventos e checkpoint de leitura          |
| [`audit-trail.md`](audit-trail.md)                     | Auditoria append-only, catálogo e origens                        |
| [`portal-config.md`](portal-config.md)                 | Configuração do portal, categorias, status e assets              |
| [`users-and-profiles.md`](users-and-profiles.md)       | Extensões de solicitante/profissional e autoatendimento          |
| [`reports.md`](reports.md)                             | Dashboard, métricas e exportação CSV                             |
| [`notifications.md`](notifications.md)                 | Eventos, audiência, allowlist e entrega SSE                      |
| [`public-tracking.md`](public-tracking.md)             | Modo de acesso, identidade do solicitante e anti-enumeração      |
| [`duplicate-detection.md`](duplicate-detection.md)     | Alerta de duplicidade, corpus, texto tarjado, janela e confiança |

## Decisões pendentes

As decisões abaixo ainda não foram fechadas. Os documentos de regra registram o
**comportamento atual do código**; esta lista concentra os pontos em aberto, em
vez de inventar uma regra nova:

- `free` como destino de conclusão de triagem/mapeamento (hoje só
  `conclusion_only` é aceito).
- Gestor como Responsável (hoje só `analista` é atribuível).
- Identificador público do responsável (`professional_id` × `user_id`).
- Código único para erro de validação (`400` × `422`).
- Escopo de autoatendimento de `PUT /users/me`.
- RN-010 depende de `requests.screening_result`, coluna que o fluxo atual de
  triagem não escreve.
- Saída de Status terminal via `PATCH /status` (o código não bloqueia hoje).
- Fechamento do fluxo público de pendências no modo `AUTHENTICATED`.
- `protocolMask` é apenas exibição; a geração do protocolo usa `MAAT-` fixo.
