// ---------------------------------------------------------------------------
// Status tone (reuse)
// ---------------------------------------------------------------------------

export const StatusToneTokens = {
  type: "object",
  required: ["color", "background", "backgroundLocked"],
  properties: {
    color: { type: "string", pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$", example: "#FF4444" },
    background: {
      type: "string",
      pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$",
      example: "#FFEEEE",
    },
    backgroundLocked: { type: "boolean", example: false },
  },
};

// ---------------------------------------------------------------------------
// Theme gradient
// ---------------------------------------------------------------------------

export const ThemeGradient = {
  type: "object",
  required: ["from", "to"],
  properties: {
    from: { type: "string", pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$", example: "#0F172A" },
    to: { type: "string", pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$", example: "#1E293B" },
    angle: { type: "integer", minimum: 0, maximum: 360, example: 143 },
  },
};

// ---------------------------------------------------------------------------
// Theme tokens (13 allowlisted keys)
// ---------------------------------------------------------------------------

export const ThemeTokens = {
  type: "object",
  required: [
    "background",
    "surface",
    "border",
    "textPrimary",
    "textSecondary",
    "heading",
    "richBlack",
    "primary",
    "secondary",
    "tint",
    "onPrimary",
    "onDark",
    "onGradient",
    "gradient",
    "statuses",
  ],
  properties: {
    background: { type: "string", example: "#FFFFFF" },
    surface: { type: "string", example: "#F8FAFC" },
    border: { type: "string", example: "#E2E8F0" },
    textPrimary: { type: "string", example: "#0F172A" },
    textSecondary: { type: "string", example: "#475569" },
    heading: { type: "string", example: "#0F172A" },
    richBlack: { type: "string", example: "#020617" },
    primary: { type: "string", example: "#2563EB" },
    secondary: { type: "string", example: "#64748B" },
    tint: { type: "string", example: "#DBEAFE" },
    onPrimary: { type: "string", example: "#FFFFFF" },
    onDark: { type: "string", example: "#FFFFFF" },
    onGradient: { type: "string", example: "#FFFFFF" },
    gradient: { $ref: "#/components/schemas/ThemeGradient" },
    statuses: {
      type: "object",
      required: ["error", "success", "info", "warning", "neutral"],
      properties: {
        error: { $ref: "#/components/schemas/StatusToneTokens" },
        success: { $ref: "#/components/schemas/StatusToneTokens" },
        info: { $ref: "#/components/schemas/StatusToneTokens" },
        warning: { $ref: "#/components/schemas/StatusToneTokens" },
        neutral: { $ref: "#/components/schemas/StatusToneTokens" },
      },
      example: {
        error: { color: "#DC2626", background: "#FEF2F2", backgroundLocked: false },
        success: { color: "#166534", background: "#F0FDF4", backgroundLocked: false },
        info: { color: "#1D4ED8", background: "#EFF6FF", backgroundLocked: false },
        warning: { color: "#D97706", background: "#FFFBEB", backgroundLocked: false },
        neutral: { color: "#4B5563", background: "#F3F4F6", backgroundLocked: false },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Portal theme (light / dark)
// ---------------------------------------------------------------------------

export const PortalTheme = {
  type: "object",
  required: ["light", "dark"],
  properties: {
    light: { $ref: "#/components/schemas/ThemeTokens" },
    dark: { $ref: "#/components/schemas/ThemeTokens" },
  },
};

// ---------------------------------------------------------------------------
// Portal assets (URLs)
// ---------------------------------------------------------------------------

export const PortalAssets = {
  type: "object",
  required: [
    "logoLightUrl",
    "logoDarkUrl",
    "logoUsePrimaryColor",
    "avatarLightUrl",
    "avatarDarkUrl",
    "loginImageLightUrl",
    "loginImageDarkUrl",
    "faviconLightUrl",
    "faviconDarkUrl",
  ],
  properties: {
    logoLightUrl: { type: "string", example: "/uploads/portal/logo-light-abc.png" },
    logoDarkUrl: { type: "string", example: "/uploads/portal/logo-dark-abc.png" },
    logoUsePrimaryColor: { type: "boolean", example: false },
    avatarLightUrl: { type: "string", example: "/uploads/portal/avatar-light-abc.png" },
    avatarDarkUrl: { type: "string", example: "/uploads/portal/avatar-dark-abc.png" },
    loginImageLightUrl: { type: "string", example: "/uploads/portal/login-light-abc.png" },
    loginImageDarkUrl: { type: "string", example: "/uploads/portal/login-dark-abc.png" },
    faviconLightUrl: { type: "string", example: "/uploads/portal/favicon-light-abc.png" },
    faviconDarkUrl: { type: "string", example: "/uploads/portal/favicon-dark-abc.png" },
  },
};

// ---------------------------------------------------------------------------
// Portal category
// ---------------------------------------------------------------------------

export const PortalCategory = {
  type: "object",
  required: ["id", "name", "description", "isActive"],
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", maxLength: 40, example: "Infraestrutura" },
    description: { type: "string", maxLength: 200, example: "Demandas de TI e infraestrutura" },
    isActive: { type: "boolean", example: true },
  },
};

// ---------------------------------------------------------------------------
// Portal status
// ---------------------------------------------------------------------------

export const PortalStatus = {
  type: "object",
  required: [
    "id",
    "name",
    "isCore",
    "isPublic",
    "isTerminal",
    "triageMode",
    "mappingMode",
    "isRestricted",
    "tone",
    "isActive",
  ],
  properties: {
    id: { type: "integer", minimum: 1, maximum: 50, example: 1 },
    name: { type: "string", maxLength: 40, example: "Solicitação enviada" },
    isCore: { type: "boolean", example: true },
    isPublic: { type: "boolean", example: true },
    isTerminal: { type: "boolean", example: false },
    triageMode: { type: "string", enum: ["none", "free", "conclusion_only"], example: "none" },
    mappingMode: { type: "string", enum: ["none", "free", "conclusion_only"], example: "none" },
    isRestricted: { type: "boolean", example: false },
    tone: {
      type: "string",
      enum: ["error", "success", "info", "warning", "neutral"],
      example: "neutral",
    },
    isActive: { type: "boolean", example: true },
  },
};

// ---------------------------------------------------------------------------
// Prioritization weights (11 criteria, integer 1-10)
// ---------------------------------------------------------------------------

export const PrioritizationWeights = {
  type: "object",
  required: [
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
  ],
  properties: {
    operationalImpact: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    operationalRisk: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    urgency: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    volumetry: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    manualEffort: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    clientImpact: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    regulatoryDeadline: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    affectedAreas: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    strategicAlignment: { type: "integer", minimum: 1, maximum: 10, example: 5 },
    estimatedComplexity: { type: "integer", minimum: 1, maximum: 10, example: 5 },
  },
};

// ---------------------------------------------------------------------------
// Portal config — GET /portal-config (resposta, plano)
// ---------------------------------------------------------------------------

export const PortalConfig = {
  type: "object",
  required: [
    "platformName",
    "solicitationMode",
    "protocolMask",
    "theme",
    "assets",
    "categories",
    "statuses",
    "prioritizationWeights",
  ],
  properties: {
    platformName: { type: "string", example: "MAAT" },
    solicitationMode: { type: "string", enum: ["PUBLIC", "AUTHENTICATED"], example: "PUBLIC" },
    protocolMask: { type: "string", example: "MAAT" },
    theme: { $ref: "#/components/schemas/PortalTheme" },
    assets: { $ref: "#/components/schemas/PortalAssets" },
    categories: {
      type: "array",
      items: { $ref: "#/components/schemas/PortalCategory" },
    },
    statuses: {
      type: "array",
      items: { $ref: "#/components/schemas/PortalStatus" },
    },
    prioritizationWeights: { $ref: "#/components/schemas/PrioritizationWeights" },
  },
};

// ---------------------------------------------------------------------------
// Portal config — GET /portal-config/sections (seções legíveis ao ator)
// ---------------------------------------------------------------------------

export const PortalSections = {
  type: "object",
  description:
    "Visão administrativa da configuração. Cada membro está presente apenas quando o ator tem a chave de leitura da seção: " +
    "`portal_setting:read` → platformName, solicitationMode, protocolMask; `theme:read` → theme, assets; " +
    "`category:read` → categories; `status:read` → statuses; `prioritization_config:read` → prioritizationWeights.",
  properties: {
    platformName: { type: "string", example: "MAAT" },
    solicitationMode: { type: "string", enum: ["PUBLIC", "AUTHENTICATED"], example: "PUBLIC" },
    protocolMask: { type: "string", example: "MAAT" },
    theme: { $ref: "#/components/schemas/PortalTheme" },
    assets: { $ref: "#/components/schemas/PortalAssets" },
    categories: {
      type: "array",
      items: { $ref: "#/components/schemas/PortalCategory" },
    },
    statuses: {
      type: "array",
      items: { $ref: "#/components/schemas/PortalStatus" },
    },
    prioritizationWeights: { $ref: "#/components/schemas/PrioritizationWeights" },
  },
};

// ---------------------------------------------------------------------------
// PATCH request bodies
// ---------------------------------------------------------------------------

export const PortalAccessPatchBody = {
  type: "object",
  required: ["solicitationMode"],
  properties: {
    solicitationMode: {
      type: "string",
      enum: ["PUBLIC", "AUTHENTICATED"],
      example: "PUBLIC",
    },
  },
};

export const PortalIdentityPatchBody = {
  type: "object",
  properties: {
    platformName: { type: "string", minLength: 1, maxLength: 80, example: "MAAT" },
    protocolMask: {
      type: "string",
      pattern: "^[A-Za-z0-9]+$",
      maxLength: 10,
      example: "MAAT",
    },
  },
};

export const PortalThemePatchBody = {
  type: "object",
  required: ["theme"],
  properties: {
    theme: { $ref: "#/components/schemas/PortalTheme" },
  },
};

export const PortalCategoriesPatchBody = {
  type: "object",
  required: ["categories"],
  properties: {
    categories: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: { $ref: "#/components/schemas/PortalCategory" },
    },
  },
};

export const PortalStatusesPatchBody = {
  type: "object",
  required: ["statuses"],
  properties: {
    statuses: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: { $ref: "#/components/schemas/PortalStatus" },
    },
  },
};

export const PortalPrioritizationWeightsPatchBody = {
  type: "object",
  required: ["prioritizationWeights"],
  properties: {
    prioritizationWeights: { $ref: "#/components/schemas/PrioritizationWeights" },
  },
};
