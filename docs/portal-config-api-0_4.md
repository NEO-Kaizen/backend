# Contrato de API — Configuração do Portal (PortalConfig)

Contrato de comunicação Frontend ↔ Backend para a **configuração do portal**:
leitura pública dos parâmetros de runtime e edição administrativa por seção
(tela `/configuracoes`). Cada seção é um recurso independente com seu próprio
`PATCH` — o frontend salva/cancela card a card.

- Fonte de verdade: issue `#90` (configuração do portal).
- Referências no frontend: `src/lib/types/portal-config.ts`,
  `src/lib/config/portal-config.*`, `src/lib/utils/validations.ts`,
  `src/lib/mocks/portal-config.mock.ts`.
- Autenticação: `GET /portal-config` é **público** (consumido no SSR de todas as
  rotas). Os `PATCH` de seção exigem cookie `session_id` + perfil
  **Administrador**.
- Erros sempre no envelope:
  `{ "status": "error", "statusCode": number, "message": string }`.
- Convenções: chaves `camelCase` em inglês; valores de domínio em PT-BR; cores
  hex `#RRGGBB` ou `#RRGGBBAA`; ids de categoria/status inteiros positivos.
- A configuração é um **singleton**: existe uma única config do portal. Os
  `PATCH` atualizam **apenas a seção indicada**; nenhum `PATCH` de seção altera
  as demais.

---

## Changelog (0_3 → 0_4)

- `assets` no `PATCH` multipart: a parte JSON `assets` é **opcional** quando há
  ao menos um arquivo; um upload apenas de binário pode omiti-la.
- Defaults de leitura do `GET` documentados: `PortalStatus.isActive` ausente =
  `true`; `PortalCategory.isActive` ausente = `false`; `backgroundLocked`
  ausente = `false`.
- Ordem de serialização de `ThemeTokens` corrigida no bloco de tipos: `gradient`
  vem antes de `statuses` (ordem relevante para a comparação de rascunho no
  cliente).
- `blob:` documentado como exceção de preview em dev no sanitize de URL.
- `protocolMask`: documentada a máscara derivada
  `^<PREFIX>-[A-Z0-9]{4}-[A-Z0-9]{4}$`.
- Defaults de seed (paletas, categorias, statuses, pesos e assets) consolidados
  no **Anexo A** e no exemplo do `GET`.
- Matriz de **status default** corrigida de 6 para os **17 valores validados com
  produto** (`plans/validacao-status-defaults.md`); `PRIVATE` da validação
  corresponde a `INTERNAL` no contrato. Estendida em **19** com as saídas de
  triagem `18`/`19` (ver Anexo A / `contract-triage_04.md`).
- Pendências (histórico): backend deve aceitar `heading` no `PATCH` de tema;
  confirmar o tratamento de `isActive` ausente no `GET` e o gradiente default
  do dark — **itens resolvidos** (ver “Pendências de alinhamento”).

## Changelog (0_4 → v4 — issue #124, Motor de Status)

Delta completo em `portal-config-statuses-amend.md` (product-response v4 §1.2).
**Apenas `PortalConfig.statuses` muda**; `access`, `identity`, `theme`, `assets`,
`categories` e `prioritization-weights` ficam idênticos ao 0_4.

- `PortalStatus` passa de 6 para **10 campos**: derrubados `visibility`/
  `closesRequest`; adicionados `order`, `isCore`, `isPublic`, `isTerminal`,
  `triageMode`, `mappingMode`, `isRestricted` (mapeamento legado abaixo).
- Fase por modo: `triageMode`/`mappingMode` ∈ `none|free|conclusion_only`.
- `isCore` = ids `1,3,4,7,16,17` — imutáveis/indeletáveis na API (409).
- **Compat durante rollout:** o `PATCH /statuses` aceita aliases legados
  (`visibility`→`isPublic`, `isTriageExit`→`triageMode`, `closesRequest`→
  `isTerminal`) normalizados pelo schema (`normalizeStatusLegacy`).
- Unificação do ciclo em **3 endpoints**: `POST triage`, `PUT mapping`,
  `PATCH /requests/:protocol/status` único com bypass Admin (sem rota
  `.../status/override`). Todo `status change` exige `justification` (`1..4000`).
- Backend: `Anexo A` com 17 status; saídas de triagem 18–22 mantidas fora da
  API (`triageMode: conclusion_only`, `mappingMode: none`, `isTerminal=is_final`).

---

## Tipos compartilhados

```ts
// Modo de acesso ao formulário de solicitação.
export type SolicitationMode = "PUBLIC" | "AUTHENTICATED";

// Assets do portal — URLs de imagem (relativa do próprio app ou http(s)), em
// par claro/escuro, mais flags de apresentação. `*DarkUrl` vazio cai para a
// variante clara.
export interface PortalAssets {
  logoLightUrl: string;
  logoDarkUrl: string;
  // Quando true, o logo (SVG) é renderizado monocromático na cor primária e a
  // variante escura é IGNORADA. Sem efeito para assets que não sejam SVG.
  logoUsePrimaryColor: boolean;
  avatarLightUrl: string;
  avatarDarkUrl: string;
  loginImageLightUrl: string;
  loginImageDarkUrl: string;
  faviconLightUrl: string;
  faviconDarkUrl: string;
}

export const ASSET_KEYS = [
  "logoLightUrl",
  "logoDarkUrl",
  "avatarLightUrl",
  "avatarDarkUrl",
  "loginImageLightUrl",
  "loginImageDarkUrl",
  "faviconLightUrl",
  "faviconDarkUrl",
] as const;

export type AssetKey = (typeof ASSET_KEYS)[number];

// Atualização parcial de assets do card: apenas as chaves alteradas (URLs) +
// o flag opcional de cor primária do logo.
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};

// Tom visual de um status — allowlist semântica (nome da cor, não da etapa).
export const STATUS_TONES = ["error", "success", "info", "warning", "neutral"] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

// Cores de um tom (modelo monocromático): acento (`color`) e fundo
// (`background`). O rótulo e o ponto usam o acento; a borda é derivada de
// `color` via color-mix e não é armazenada. `backgroundLocked` indica fundo
// manual/travado — enquanto `true`, mudar o acento não recalcula o fundo.
export interface StatusToneTokens {
  color: string;
  background: string;
  backgroundLocked: boolean;
}

// Papéis de uma paleta. `statuses` guarda as cores por tom; `gradient` é
// composto (from/to/angle) — ambos fora da record de tokens simples.
export const THEME_TOKEN_KEYS = [
  "background",
  "surface",
  "border",
  "textPrimary",
  "textSecondary",
  // Cor dos títulos (h1–h6). Default = `primary` da paleta, mas configurável
  // para permitir títulos neutros com a marca reservada a CTAs/links.
  "heading",
  "richBlack",
  "primary",
  "secondary",
  "tint",
  "onPrimary",
  "onDark",
  "onGradient",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

// Gradiente de superfícies de destaque (hero/banner). Modelado por paleta,
// independente de `primary`/`secondary` — no dark o gradiente precisa seguir
// escuro para o texto branco manter contraste (não derivar das cores de marca).
export interface ThemeGradient {
  from: string; // hex #RRGGBB / #RRGGBBAA
  to: string; // hex #RRGGBB / #RRGGBBAA
  angle?: number; // graus 0..360 (default 143 quando ausente)
}

export interface ThemeTokens extends Record<ThemeTokenKey, string> {
  gradient: ThemeGradient;
  // Emitido depois de `gradient` na serialização (ordem relevante para a
  // comparação de rascunho no cliente).
  statuses: Record<StatusTone, StatusToneTokens>;
}

// Paletas do portal — claro e escuro. O usuário escolhe qual usar (preferência
// local); o admin configura as duas.
export interface PortalTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}

// Categoria da demanda. `id` é a chave estável; em itens **novos** é gerado pelo
// cliente (maior id atual + 1) e aceito pelo backend. A ordem do array é a ordem
// de exibição.
export interface PortalCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

// Modo de phase de um status (v4, issue #124). `none` = não alcançável pela
// fase; `free` = alcançável por analista via `PATCH /status`;
// `conclusion_only` = saída exclusiva do `POST triage`/`PUT mapping`.
export type StatusMode = "none" | "free" | "conclusion_only";

// Status do ciclo de vida (Motor de Status v4). `order` é a posição de
// exibição (única, 1..50); `isCore` (1,3,4,7,16,17) congela nome/ordem/flag na
// API; `isPublic` controla a visibilidade ao solicitante; `isTerminal`
// encerra a solicitação (Concluído/Cancelado); `isRestricted` (Priorizado)
// só é alcançável por Administrador via override. `tone` e `isActive` seguem
// o 0_4. Status nunca são excluídos (preservação de histórico).
export interface PortalStatus {
  id: number;
  name: string;
  order: number;
  isCore: boolean;
  isPublic: boolean;
  isTerminal: boolean;
  isRestricted: boolean;
  triageMode: StatusMode;
  mappingMode: StatusMode;
  tone: StatusTone;
  isActive: boolean;
}

// Critérios fixos de priorização (allowlist das chaves aceitas).
export const PRIORITIZATION_CRITERIA = [
  "operationalImpact",
  "operationalRisk",
  "urgency",
  "volumetry",
  "manualEffort",
  "clientImpact",
  "regulatoryDeadline",
  "affectedAreas",
  "strategicAlignment",
  "estimatedComplexity",
] as const;

export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];

// Pesos da priorização — objeto completo, sempre com todas as chaves, cada peso
// inteiro entre 1 e 10.
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;

// Config completa (GET) e recortes de cada seção editável.
export interface PortalConfig {
  platformName: string;
  solicitationMode: SolicitationMode;
  protocolMask: string;
  theme: PortalTheme;
  assets: PortalAssets;
  categories: PortalCategory[];
  statuses: PortalStatus[];
  prioritizationWeights: PrioritizationWeights;
}

export type AccessSection = Pick<PortalConfig, "solicitationMode">;
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
export type ThemeSection = Pick<PortalConfig, "theme">;
export type AssetsSection = Pick<PortalConfig, "assets">;
export type CategoriesSection = Pick<PortalConfig, "categories">;
export type StatusesSection = Pick<PortalConfig, "statuses">;
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;

// Chave de rota de cada seção editável — define o sufixo de
// `PATCH /portal-config/:section`.
export type PortalConfigSection =
  "access" | "identity" | "theme" | "assets" | "categories" | "statuses" | "prioritization-weights";
```

---

## 1. GET /portal-config — Ler configuração

Público, sem autenticação. Retorna a config consolidada do portal. É chamado no
`hooks.server.ts` de **todas** as rotas (SSR); falha de rede cai nos defaults
locais do frontend — o backend não precisa tratar esse fallback.

**Response 200** — `PortalConfig`:

```json
{
  "platformName": "MAAT",
  "solicitationMode": "PUBLIC",
  "protocolMask": "MAAT",
  "theme": {
    "light": {
      "background": "#f0f4f8",
      "surface": "#fafafa",
      "border": "#e5e7eb",
      "textPrimary": "#3c3e47",
      "textSecondary": "#757682",
      "heading": "#00236f",
      "richBlack": "#0f1a2a",
      "primary": "#00236f",
      "secondary": "#0058be",
      "tint": "#d6e7fb",
      "onPrimary": "#ffffff",
      "onDark": "#ffffff",
      "onGradient": "#ffffff",
      "gradient": { "from": "#002068", "to": "#003399", "angle": 143 },
      "statuses": {
        "error": { "color": "#ef4444", "background": "#ef444410", "backgroundLocked": true },
        "success": { "color": "#10b981", "background": "#10b98110", "backgroundLocked": true },
        "info": { "color": "#0058be", "background": "#0058be10", "backgroundLocked": true },
        "warning": { "color": "#956006", "background": "#f59e0b10", "backgroundLocked": true },
        "neutral": { "color": "#4b5563", "background": "#e5e7eb", "backgroundLocked": true }
      }
    },
    "dark": {
      "background": "#0b0f1a",
      "surface": "#141b2e",
      "border": "#2a3346",
      "textPrimary": "#e5e7eb",
      "textSecondary": "#9aa3b2",
      "heading": "#4c7dff",
      "richBlack": "#0f1a2a",
      "primary": "#4c7dff",
      "secondary": "#5b9bff",
      "tint": "#1b2942",
      "onPrimary": "#0b0f1a",
      "onDark": "#ffffff",
      "onGradient": "#ffffff",
      "gradient": { "from": "#002068", "to": "#003399", "angle": 143 },
      "statuses": {
        "error": { "color": "#f87171", "background": "#4c0f0a", "backgroundLocked": true },
        "success": { "color": "#4ade80", "background": "#0f2e1d", "backgroundLocked": true },
        "info": { "color": "#5b9bff", "background": "#1b2942", "backgroundLocked": true },
        "warning": { "color": "#fbbf24", "background": "#4a2e0f", "backgroundLocked": true },
        "neutral": { "color": "#9aa3b2", "background": "#2a3346", "backgroundLocked": true }
      }
    }
  },
  "assets": {
    "logoLightUrl": "/uploads/portal/logo-light-default.svg",
    "logoDarkUrl": "/uploads/portal/logo-dark-default.svg",
    "logoUsePrimaryColor": true,
    "avatarLightUrl": "/uploads/portal/avatar-light-default.svg",
    "avatarDarkUrl": "/uploads/portal/avatar-dark-default.svg",
    "loginImageLightUrl": "/uploads/portal/login-light-default.png",
    "loginImageDarkUrl": "/uploads/portal/login-dark-default.png",
    "faviconLightUrl": "/uploads/portal/favicon-light-default.svg",
    "faviconDarkUrl": "/uploads/portal/favicon-dark-default.svg"
  },
  "categories": [
    {
      "id": 1,
      "name": "Automação",
      "description": "Automação de atividades manuais repetitivas",
      "isActive": true
    }
  ],
  "statuses": [
    {
      "id": 1,
      "name": "Solicitação enviada",
      "visibility": "PUBLIC",
      "closesRequest": false,
      "tone": "neutral",
      "isActive": true
    }
  ],
  "prioritizationWeights": {
    "operationalImpact": 1,
    "operationalRisk": 1,
    "urgency": 1,
    "volumetry": 1,
    "manualEffort": 1,
    "clientImpact": 1,
    "regulatoryDeadline": 1,
    "affectedAreas": 1,
    "strategicAlignment": 1,
    "estimatedComplexity": 1
  }
}
```

> O tema representado acima é só exemplo; o backend pode iniciar sem tema e o
> frontend aplica os defaults locais por token. Os `THEME_TOKEN_KEYS` (incluindo
> `heading`) devem estar sempre presentes quando o tema for retornado.

**Erros:** `500` (erro interno, sem detalhes vazados).

---

## 2. PATCH /portal-config/access — Modo de acesso (Card 1)

Admin. Atualiza o modo de abertura do portal.

**Body:**

```ts
export interface UpdateAccessRequest {
  solicitationMode: SolicitationMode; // 'PUBLIC' | 'AUTHENTICATED'
}
```

**Validações:** `solicitationMode` obrigatório e na allowlist.

**Response 200** — `AccessSection`:

```json
{ "solicitationMode": "AUTHENTICATED" }
```

**Erros:** `400` (ausente/fora da allowlist), `401`, `403`, `500`.

---

## 3. PATCH /portal-config/identity — Identidade da plataforma (Card 2)

Admin. Atualiza nome exibido e máscara do protocolo. Campos parciais: envie só
os alterados.

**Body:**

```ts
export interface UpdateIdentityRequest {
  platformName?: string; // máx. 80, trim não-vazio
  protocolMask?: string; // máx. 10, apenas letras e números
}
```

**Validações:** ao menos um campo presente; `platformName`
(`validations.ts` → `isValidPlatformName`); `protocolMask`
(`isValidProtocolMask`, `^[A-Za-z0-9]+$`).

> `protocolMask` é apenas o **bloco inicial** do protocolo (ex.: `MAAT`). A
> máscara exibida é derivada no cliente como
> `^<PREFIX>-[A-Z0-9]{4}-[A-Z0-9]{4}$` (ex.: `MAAT-8K3P-9X2M`).

**Response 200** — `IdentitySection`:

```json
{ "platformName": "MAAT", "protocolMask": "MAAT" }
```

**Erros:** `400` (nenhum campo; valor inválido), `401`, `403`, `500`.

---

## 4. PATCH /portal-config/theme — Identidade visual (Card 3)

Admin. **Atômico**: envia as duas paletas completas. Substitui todo o tema;
não há merge parcial por token.

**Body:**

```ts
export interface UpdateThemeRequest {
  theme: PortalTheme; // light + dark completos
}
```

**Validações:**

- `light` e `dark` presentes; **todos** os `THEME_TOKEN_KEYS` em hex válido —
  incluindo o token `heading`;
- `gradient` com `from`/`to` em hex (`#RRGGBB`/`#RRGGBBAA`) e `angle` inteiro
  0..360 (opcional; assume 143 quando ausente);
- `statuses` com os 5 `STATUS_TONES`; cada tom com `color`/`background` em hex
  (`#RRGGBB`/`#RRGGBBAA`) e `backgroundLocked` booleano.

> O contraste (advisor) é **apenas um aviso** no frontend e **nunca bloqueia** o
> salvamento; o backend não precisa validar contraste.

**Response 200** — `ThemeSection`:

```json
{ "theme": { "light": { "...": "..." }, "dark": { "...": "..." } } }
```

**Erros:** `400` (paleta ausente, cor inválida, tom inválido), `401`, `403`,
`500`.

---

## 5. PATCH /portal-config/assets — Assets (Card 4)

Admin. **`multipart/form-data`** e **atômico**: o backend grava os binários
enviados e atualiza as URLs no config numa única operação. Nada é persistido até
esta chamada (o frontend só faz preview local antes de salvar).

**Partes do multipart:**

| Parte                | Tipo               | Descrição                                                                                                |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `assets`             | `application/json` | `PortalAssetsPatch` (URLs por variante + `logoUsePrimaryColor`). Opcional quando há ao menos um arquivo. |
| `logoLightUrl`       | binário (arquivo)  | Novo arquivo do logo (tema claro) (opcional).                                                            |
| `logoDarkUrl`        | binário (arquivo)  | Novo arquivo do logo (tema escuro) (opcional).                                                           |
| `avatarLightUrl`     | binário (arquivo)  | Novo arquivo do avatar (tema claro) (opcional).                                                          |
| `avatarDarkUrl`      | binário (arquivo)  | Novo arquivo do avatar (tema escuro) (opcional).                                                         |
| `loginImageLightUrl` | binário (arquivo)  | Novo arquivo da imagem de login (tema claro) (opcional).                                                 |
| `loginImageDarkUrl`  | binário (arquivo)  | Novo arquivo da imagem de login (tema escuro) (opcional).                                                |
| `faviconLightUrl`    | binário (arquivo)  | Novo arquivo do favicon (tema claro) (opcional).                                                         |
| `faviconDarkUrl`     | binário (arquivo)  | Novo arquivo do favicon (tema escuro) (opcional).                                                        |

Regra de merge: cada parte binária nomeada por chave define a URL daquela chave
(após o storage); cada chave presente no JSON `assets` define a URL diretamente
(útil para restaurar um asset padrão estático). Chaves ausentes permanecem como
estão. Enviar ao menos uma parte: o JSON `assets` **ou** ao menos um arquivo —
um upload apenas de binário pode omitir a parte `assets`.

> Quando `logoUsePrimaryColor` é `true`, a variante escura do logo é ignorada
> (o logo é renderizado monocromático na cor primária).

**Tipos/tamanho por asset** (espelho de `ASSET_FILE_RULES`):

| Chave (claro/escuro)                       | MIME aceitos                                 | Extensões                        | Máx. |
| ------------------------------------------ | -------------------------------------------- | -------------------------------- | ---- |
| `logoLightUrl` / `logoDarkUrl`             | `image/png`, `image/svg+xml`                 | `.png`, `.svg`                   | 2 MB |
| `avatarLightUrl` / `avatarDarkUrl`         | `image/jpeg`, `image/png`                    | `.jpg`, `.jpeg`, `.png`          | 2 MB |
| `faviconLightUrl` / `faviconDarkUrl`       | `image/x-icon`, `image/svg+xml`, `image/png` | `.ico`, `.svg`, `.png`           | 1 MB |
| `loginImageLightUrl` / `loginImageDarkUrl` | `image/jpeg`, `image/png`, `image/webp`      | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB |

**Response 200** — `AssetsSection` (URLs consolidadas: as 8 variantes + `logoUsePrimaryColor`):

```json
{
  "assets": {
    "logoLightUrl": "/uploads/portal/logo-light.svg",
    "logoDarkUrl": "/uploads/portal/logo-dark.svg",
    "logoUsePrimaryColor": true,
    "avatarLightUrl": "/uploads/portal/avatar-light.svg",
    "avatarDarkUrl": "/uploads/portal/avatar-dark.svg",
    "loginImageLightUrl": "/uploads/portal/login-light.webp",
    "loginImageDarkUrl": "/uploads/portal/login-dark.webp",
    "faviconLightUrl": "/uploads/portal/favicon-light.ico",
    "faviconDarkUrl": "/uploads/portal/favicon-dark.ico"
  }
}
```

**Erros:** `400` (nenhuma parte; JSON inválido; chave fora da allowlist; URL
inválida), `413` (excede o tamanho), `415` (tipo não permitido), `401`, `403`,
`500`.

---

## 6. PATCH /portal-config/categories — Categorias (Card 5)

Admin. **Lista atômica**: envia a lista completa; a ordem é a de exibição.

**Body:**

```ts
export interface UpdateCategoriesRequest {
  categories: PortalCategory[];
}
```

**Validações:**

- 1 a 50 itens; `id` inteiro positivo (aceito gerado pelo cliente em itens
  novos); `name` trim 1..40; `description` ≤ 200; `isActive` booleano;
- nomes únicos (trim, case-insensitive); ao menos uma categoria ativa.

**Response 200** — `CategoriesSection` (lista consolidada, com ids finais).

**Erros:** `400` (vazia, > 50, item inválido, nome repetido, nenhuma ativa),
`401`, `403`, `500`.

---

## 7. PATCH /portal-config/statuses — Status (Card 6)

Admin. **Lista atômica**: envia a lista completa; a ordem é a de exibição.

**Body:**

```ts
export interface UpdateStatusesRequest {
  statuses: PortalStatus[];
}
```

**Validações:** 1 a 50 itens; `id` inteiro positivo; `name` trim 1..40; nomes
únicos (case-insensitive); `order` 1..50 único; `isCore/isPublic/isTerminal/
isRestricted/isActive` booleanos; `triageMode/mappingMode` em
`none|free|conclusion_only`; `tone` nos 5 `STATUS_TONES`; ao menos um status
ativo. Regras v4 (delta §1):

- `isCore` = ids `1,3,4,7,16,17` — recusar 400 se o item tentar alterar
  `name`/`order`/`isCore` (core congelado na API).
- `isRestricted && (triageMode !== "none" || mappingMode !== "none")` → `400`
  (Priorizado só `none/none`).
- **Compat:** aliases legados (`visibility`→`isPublic`, `isTriageExit`→
  `triageMode`, `closesRequest`→`isTerminal`) são aceitos durante o rollout e
  normalizados pelo schema.
- Erros com `code`: `core_status_name_locked`, `core_status_order_locked`,
  `core_status_flag_locked`, `restricted_status_mode_invalid`, `inactive_core_status`.

**Response 200** — `StatusesSection` (lista consolidada, com ids finais).

**Erros:** `400` (vazia, > 50, item inválido, nome repetido, core alterado),
`401`, `403`, `500`.

---

## 8. PATCH /portal-config/prioritization-weights — Pesos (Card 7)

Admin. **Objeto atômico**: envia todos os critérios com seus pesos.

**Body:**

```ts
export interface UpdatePrioritizationWeightsRequest {
  prioritizationWeights: PrioritizationWeights;
}
```

**Validações:** todas as `PRIORITIZATION_CRITERIA` presentes; nenhuma chave
desconhecida; cada peso é um **inteiro de 1 a 10**.

**Response 200** — `PrioritizationWeightsSection`:

```json
{ "prioritizationWeights": { "operationalImpact": 2, "operationalRisk": 1 } }
```

**Erros:** `400` (chave faltando/desconhecida, peso fora de 1–10), `401`,
`403`, `500`.

---

## Observações / divergências

- **Status como fonte única.** `PortalConfig.statuses` é a fonte do ciclo de
  vida configurável. O `RequestStatus` de 17 valores fixos de
  `solicitations-api-requests-0_4.md` passa a ser **dinâmico** (nome validado
  contra este cadastro) — alinhamento pendente com aquele contrato.
- **Categorias por nome.** As solicitações referenciam a categoria pelo **nome**
  (string validada contra o cadastro); o `id` serve ao CRUD administrativo. O
  `id` de itens novos é gerado no cliente (maior id + 1) e aceito pelo backend.
  Referência por `id` fica como evolução futura.
- **Pesos x priorização.** `PATCH /portal-config/prioritization-weights`
  atualiza os mesmos pesos usados pelo módulo de priorização
  (`prioritization-api.md`, `criteria.weight`). A escala deste contrato passou a
  ser **inteiro de 1 a 10**, alinhada à representação do `criteria.weight` (seed
  10). A decisão **D-O3** daquele contrato (“o backend nunca lê peso vindo do
  frontend”) segue registrada: aqui a tela de configurações é o caminho
  administrativo de escrita. Os defaults podem ser representados como `1` ou
  `1.0`; o contrato trata ambos como o inteiro `1`.
- **Tema monocromático.** `StatusToneTokens` não possui `text`: o rótulo usa o
  próprio `color`. São 5 tons. `backgroundLocked` é persistido (intenção de
  edição do admin).
- **Defaults de leitura (`GET`).** Campos opcionais/legados: `PortalStatus.isActive`
  ausente é tratado como ativo (`true`); `PortalCategory.isActive` ausente é
  tratado como inativo (`false`); `StatusToneTokens.backgroundLocked` ausente é
  tratado como `false`. No `PATCH` os três são obrigatórios e booleanos.
- **Títulos (`heading`).** Cor dos `h1–h6`, configurável por paleta. Por padrão
  igual à `primary` (MAAT mantém títulos na cor da marca); clientes podem torná-la
  neutra (ex.: `textPrimary`) para reservar a cor de marca a CTAs/links. É
  aplicada via `--heading-color` (branch `fix/89-public-theme-bootstrap`).
- **Tokens de "sobre" e gradiente.** `onPrimary` (texto sobre
  `primary`/`secondary`), `onDark` (texto sobre superfícies sempre escuras) e
  `onGradient` (texto sobre o gradiente) são configuráveis por paleta, assim
  como `gradient` (`from`/`to`/`angle`). Eles substituem os antigos
  `--on-primary`/`--on-dark`/`--gradient` estáticos do CSS. O **mapeamento das
  custom properties e o consumo** (Banner/hero/tooltip/botões) é feito na branch
  `fix/89-public-theme-bootstrap`, que passa a ligar `--on-primary`/`--on-dark`
  às paletas (antes havia valor fixo no dark).
- **Advisor de contraste (frontend).** Avisa (nunca bloqueia) o contraste WCAG
  dos pares: `onPrimary × primary`/`secondary`, `onDark × richBlack`,
  `onGradient × gradient` (por ponta) e `textPrimary`/`textSecondary`/`heading ×
surface`/`background`.
- **Assets multipart.** Diferente das demais seções (JSON), o `PATCH` de assets
  é `multipart/form-data` para permitir commit atômico de binário + config, sem
  endpoint de upload separado e sem arquivo órfão em cancelamento. No sanitize
  do frontend, `blob:` é aceito apenas para o preview local do mock em dev; o
  backend deve retornar URL relativa do app ou http(s).
- **Sem `POST` de config.** O config é singleton; a escrita é sempre `PATCH` por
  seção. Não há criação.

## Pendências de alinhamento

> **Status (após sync `20260924000000_sync_portal_config_reference_0_4`):**
>
> - ✅ `heading` aceito no `PATCH /theme` (allowlist = `THEME_TOKEN_KEYS`).
> - ✅ Gradiente dark default = `#002068 → #003399` (mesmo do light) em
>   `portalConfig.mappers.ts` (`DEFAULT_THEME`).
> - ✅ Statuses: coluna dinâmica + matriz Anexo A (17) + saídas de triagem
>   `18 Fora do escopo` / `19 Duplicada` (contrato triage — `isTriageExit` vive
>   em `contract-triage_04.md`, não no tipo `PortalStatus` deste documento).
> - ✅ Pesos: API `1–10` inteiro; seed `criteria.weight = 10`
>   (`prioritization-api.md` / `seeds/002_criteria.js`); fallback FE em
>   `portal-defaults.ts` pode ser `1`.
> - ✅ Variantes claro/escuro de assets + `logoUsePrimaryColor` (migration
>   `20260916180000` + `ensureDefaultAssets`).
> - ✅ Storage: binários em `uploads/portal/`, URLs `/uploads/portal/…`.
> - ⏳ Evolução: referência de categoria por `id` (hoje por nome).
>
> Itens abaixo mantidos como histórico do 0_3 → 0_4.

- Backend **aceitar o token `heading`** na allowlist do `PATCH /theme` (novo
  desde 0_2).
- Backend confirmar o **gradiente default do dark** adotado como
  `#002068 → #003399` (mesmo do light) — decisão de manter o azul por contraste.
- Backend confirmar status dinâmico x matriz de 17 valores do contrato de
  solicitações.
- Backend confirmar a reconciliação de pesos (agora **1–10 inteiro**, igual a
  `criteria.weight`; seed 10).
- Backend implementar as variantes claro/escuro dos assets e o flag
  `logoUsePrimaryColor` (tint do logo em SVG via máscara na cor primária;
  variante escura ignorada quando o flag é `true`).
- Backend definir storage/CDN dos assets e o formato das URLs retornadas.
- Evolução: referência de categoria por `id` (hoje por nome).

---

## Anexo A — Defaults para seed

Valores de `src/lib/config/portal-defaults.ts`, referência para o seed inicial do
backend. Tema, assets e pesos também constam no exemplo do `GET`; as listas de
categorias e statuses completas ficam aqui.

### Paletas (light/dark)

- Tokens: conforme o exemplo do `GET` (13 `THEME_TOKEN_KEYS` + `gradient` +
  `statuses`), com `heading` = `primary` da paleta (`#00236f` / `#4c7dff`).
- `gradient` em ambas as paletas: `{ from: "#002068", to: "#003399", angle: 143 }`.
- Tons de status: claro e escuro conforme o exemplo do `GET`, todos com
  `backgroundLocked: true`.

### Assets

| Chave (claro/escuro)                 | Default                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `logoLightUrl` / `logoDarkUrl`       | `/uploads/portal/logo-light-default.svg` (`logoUsePrimaryColor:true` → máscara SVG com `var(--primary-color)`) |
| `logoUsePrimaryColor`                | `true` (render tintado)                                                                                        |
| `avatarLightUrl` / `avatarDarkUrl`   | `/uploads/portal/avatar-*-default.svg`                                                                         |
| `loginImageLightUrl`                 | `/uploads/portal/login-light-default.png`                                                                      |
| `loginImageDarkUrl`                  | `/uploads/portal/login-dark-default.png`                                                                       |
| `faviconLightUrl` / `faviconDarkUrl` | `/uploads/portal/favicon-*-default.svg`                                                                        |

### Categorias (10, todas ativas)

| id  | name                   | description                                              |
| --- | ---------------------- | -------------------------------------------------------- |
| 1   | Automação              | Automação de atividades manuais repetitivas              |
| 2   | Melhoria de processo   | Aprimoramento de fluxos e rotinas existentes             |
| 3   | Indicador              | Criação ou ajuste de indicadores e metas                 |
| 4   | Dashboard ou relatório | Painéis, relatórios e consultas gerenciais               |
| 5   | Análise de dados       | Estudos, cruzamentos e tratamento de dados               |
| 6   | Padronização           | Padronização de procedimentos, modelos e documentos      |
| 7   | Revisão de processo    | Revisão e redesenho de processos existentes              |
| 8   | Apoio técnico          | Suporte técnico especializado às áreas                   |
| 9   | Estudo de viabilidade  | Avaliação de viabilidade técnica, operacional e de custo |
| 10  | Outros                 | Demandas que não se enquadram nas demais categorias      |

### Statuses (19 — 17 base + 2 saídas de triagem; todos ativos)

Matriz 1–17 validada com produto (`plans/validacao-status-defaults.md`). A
visibilidade `PRIVATE` da validação corresponde a `INTERNAL` no contrato.
`18`/`19` vêm do contrato de triagem (`contract-triage_04.md` §4) — o campo
`isTriageExit` não faz parte do tipo `PortalStatus` deste documento (0_4), mas
é persistido e exposto pelo `GET` (extensão 0_4 + triage).

| id  | name                        | tone    | visibility | closesRequest | isActive |
| --- | --------------------------- | ------- | ---------- | ------------- | -------- |
| 1   | Solicitação enviada         | neutral | PUBLIC     | false         | true     |
| 2   | Aguardando triagem          | info    | PUBLIC     | false         | true     |
| 3   | Em triagem                  | info    | PUBLIC     | false         | true     |
| 4   | Pendente de informações     | warning | PUBLIC     | false         | true     |
| 5   | Aguardando mapeamento       | info    | PUBLIC     | false         | true     |
| 6   | Mapeamento agendado         | info    | PUBLIC     | false         | true     |
| 7   | Em mapeamento               | info    | PUBLIC     | false         | true     |
| 8   | Em análise de viabilidade   | info    | INTERNAL   | false         | true     |
| 9   | Elegível                    | success | INTERNAL   | false         | true     |
| 10  | Não elegível                | error   | INTERNAL   | false         | true     |
| 11  | Priorizado                  | warning | INTERNAL   | false         | true     |
| 12  | Backlog                     | neutral | INTERNAL   | false         | true     |
| 13  | Direcionado para outra área | neutral | INTERNAL   | false         | true     |
| 14  | Em desenvolvimento          | info    | INTERNAL   | false         | true     |
| 15  | Em homologação              | info    | INTERNAL   | false         | true     |
| 16  | Concluído                   | success | PUBLIC     | true          | true     |
| 17  | Cancelado                   | error   | PUBLIC     | true          | true     |
| 18  | Fora do escopo              | neutral | INTERNAL   | false         | true     |
| 19  | Duplicada                   | neutral | INTERNAL   | false         | true     |

### Pesos

Seed oficial (`seeds/requester_request/002_criteria.js` e `prioritization-api.md`):
todos os 10 `PRIORITIZATION_CRITERIA` com peso **`10`** (faixa API 1..10;
CHECK de banco 0..10 por decisão de produto). O fallback local em
`portal-defaults.ts` pode usar `1` — o contrato trata `1` e `1.0` como o
inteiro `1`.
