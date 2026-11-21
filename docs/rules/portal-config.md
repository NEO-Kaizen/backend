# Configuração do portal

`GET /portal-config` é **público** (consumido no SSR). A edição é por seção,
com um `PATCH` independente por card, restrito a **Administrador**. A gravação
de cada seção é atômica.

## Seções

| Seção                   | Conteúdo                                            |
| ----------------------- | --------------------------------------------------- |
| `access`                | `solicitationMode`: `PUBLIC` ou `AUTHENTICATED`     |
| `identity`              | `platformName`, `protocolMask`                      |
| `theme`                 | paletas `light` e `dark` completas                  |
| `assets`                | URLs de logo/avatar/login/favicon em claro e escuro |
| `categories`            | lista completa de categorias                        |
| `statuses`              | catálogo completo de Status                         |
| `prioritizationWeights` | peso inteiro 1..10 para cada critério               |

## Acesso (`PATCH /portal-config/access`)

- `PUBLIC` — formulário e acompanhamento públicos (identidade do solicitante).
- `AUTHENTICATED` — rotas públicas de solicitação exigem sessão; `GET /requests`
  passa a usar o e-mail da sessão e recusa `?email=`.
- A mudança vale imediatamente para as rotas que usam `requireAccessMode()`.

## Identidade

- `platformName` — 1..80 após trim.
- `protocolMask` — apenas letras/números, até 10 caracteres.
- Ao menos um dos dois no `PATCH`.

## Tema

- Objeto completo (`light` + `dark`), sem merge parcial.
- 13 tokens de cor em hex `#RRGGBB`/`#RRGGBBAA`, `gradient` (`from`, `to`,
  `angle` 0..360) e os 5 tons (`error`, `success`, `info`, `warning`,
  `neutral`), cada um com `color`, `background`, `backgroundLocked`.
- Chave fora da allowlist é rejeitada (`.strict()`).
- Coluna nula no banco aplica o default do contrato na leitura;
  `backgroundLocked` nulo vira `false`; Status sem `isActive` explícito é
  tratado como ativo.

## Assets

- Parte `assets` (JSON com URLs) e/ou arquivos binários no multipart.
- Arquivo binário vence o JSON para a mesma chave; chaves ausentes mantêm o
  valor atual; `logoUsePrimaryColor` só vem do JSON; upload só com binários
  pode omitir `assets`.
- URLs aceitam caminho relativo (`/...`) ou `http(s)://`, até 500; `blob:` e
  `javascript:` são rejeitados.
- Limites: logo 2 MB (PNG/SVG), avatar 2 MB (JPG/PNG), imagem de login 5 MB
  (JPG/PNG/WEBP), favicon 1 MB (ICO/SVG/PNG).
- `logoUsePrimaryColor` é flag de apresentação, não URL.

## Categorias

- Lista atômica: 1..50 categorias.
- `id` é inteiro positivo estável; em item novo o cliente gera `max + 1`.
- `name` 1..40, único ignorando maiúsculas/minúsculas; `description` até 200.
- Ao menos uma categoria precisa ficar ativa.
- A ordem do array é a ordem de exibição.
- Categoria inativa permanece no histórico e não entra em novos fluxos.

## Status

- Lista atômica; a ordem do array é a ordem de exibição.
- `id` inteiro positivo em `1..50`; `name` 1..40 e único ignorando
  maiúsculas/minúsculas; `tone` na allowlist; ao menos um Status ativo.
- `isCore = true` só é aceito para os ids `1, 3, 4, 6, 7, 16, 17`.
- `isRestricted = true` exige `triageMode = none` **e** `mappingMode = none`.
- Flags e modos conforme `requests-lifecycle.md`.
- Status core são imutáveis: não podem faltar, ser removidos, renomeados,
  rebaixados a não-core, desativados ou ter flags/modos alterados.
- Violações de schema (id/name/modo inválido) → `400`; violações de core →
  `409` com código estável: `core_status_missing`, `core_status_removed`,
  `core_status_renamed`, `core_status_forced`, `core_status_forced_inactive`,
  `core_status_locked`.
- `GET /portal-config` inclui também Status inativos (`isActive: false`); eles
  permanecem no histórico e não entram em novos fluxos.
- `Priorizado` é o único restrito por padrão e não pode ser alvo de
  Analista/Gestor.

## Pesos de priorização

- Objeto completo com os 10 critérios (`operationalImpact`, `operationalRisk`,
  `urgency`, `volumetry`, `manualEffort`, `clientImpact`, `regulatoryDeadline`,
  `affectedAreas`, `strategicAlignment`, `estimatedComplexity`).
- Cada peso é inteiro 1..10. A pontuação/classificação está em
  `reports.md` e no serviço de priorização (RN-007/RN-008).

## Persistência

Configuração global fica em `system_settings`; tema em `system_themes`;
categorias e Status em tabelas próprias. Ver
[`docs/database/system-settings-persistence.md`](../database/system-settings-persistence.md).
