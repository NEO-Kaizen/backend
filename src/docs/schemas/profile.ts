const profilePermission = {
  type: "object",
  required: ["key", "custody"],
  properties: {
    key: { type: "string", example: "triage:read" },
    custody: { type: "string", enum: ["global", "own", "assigned", "all"], example: "all" },
  },
};

export const ProfilePermission = profilePermission;

/**
 * Referência pública a um Perfil: identidade estável + rótulo.
 *
 * `id` é `String(profiles.profile_id)`, a mesma identidade de `/profiles/{id}` e
 * das escritas (`profileId`). `null` aparece só em snapshot histórico que
 * preservou o nome sem registrar o ID — nenhum ID é inferido do nome.
 * `name` é rótulo de exibição e nunca participa da autorização.
 */
export const ProfileReference = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: {
      type: "string",
      example: "6",
      description: "Identidade estável do Perfil (`String(profiles.profile_id)`).",
    },
    name: {
      type: "string",
      example: "Analista",
      description: "Rótulo vigente do Perfil; nunca autoriza nem identifica.",
    },
  },
};

/**
 * Snapshot histórico de Perfil. O nome é o do momento do registro; `id` é
 * `null` quando o registro antigo guardou apenas o nome — nunca inferido.
 */
export const ProfileSnapshot = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: {
      type: "string",
      nullable: true,
      example: "2",
      description: "Identidade registrada na época; `null` quando só o nome foi preservado.",
    },
    name: {
      type: "string",
      example: "Analista",
      description: "Nome congelado no momento do registro.",
    },
  },
};

export const Profile = {
  type: "object",
  required: [
    "id",
    "name",
    "isActive",
    "isRoot",
    "isAssignableTriage",
    "isAssignableMapping",
    "userCount",
    "permissions",
  ],
  properties: {
    id: { type: "string", example: "6" },
    name: { type: "string", example: "Coordenador" },
    description: {
      type: ["string", "null"],
      example: "Tria e redistribui qualquer solicitação",
    },
    isActive: { type: "boolean", example: true },
    isRoot: {
      type: "boolean",
      example: false,
      description: "`true` apenas no próprio Perfil Admin Root.",
    },
    isAssignableTriage: { type: "boolean", example: true },
    isAssignableMapping: { type: "boolean", example: false },
    userCount: {
      type: "integer",
      example: 0,
      description: "Contas vinculadas ao Perfil, inclusive inativas.",
    },
    permissions: {
      type: "array",
      description: "Composição efetiva na ordem do catálogo de chaves.",
      items: { $ref: "#/components/schemas/ProfilePermission" },
    },
  },
};

export const ProfilePermissionCatalogEntry = {
  type: "object",
  required: ["key", "custodyType", "allowedCustodies", "dependencies"],
  properties: {
    key: { type: "string", example: "triage:read" },
    custodyType: { type: "string", enum: ["global", "custodial"], example: "custodial" },
    allowedCustodies: {
      type: "array",
      items: { type: "string", enum: ["global", "own", "assigned", "all"] },
      example: ["assigned", "all"],
    },
    dependencies: {
      type: "array",
      items: { type: "string" },
      example: [],
      description: "Chaves que precisam estar presentes junto desta.",
    },
  },
};

export const ProfileKeyCatalog = {
  type: "object",
  required: ["permissions", "assignabilityPredicates"],
  properties: {
    permissions: {
      type: "array",
      description: "As 39 chaves na ordem de referência da matriz de Perfil.",
      items: { $ref: "#/components/schemas/ProfilePermissionCatalogEntry" },
    },
    assignabilityPredicates: {
      type: "object",
      required: ["triage", "mapping"],
      properties: {
        triage: {
          type: "array",
          items: { type: "string" },
          example: ["request:read", "triage:read", "triage:write"],
        },
        mapping: {
          type: "array",
          items: { type: "string" },
          example: ["request:read", "mapping:read", "mapping:write"],
        },
      },
    },
  },
};

export const ProfileCreateRequest = {
  type: "object",
  required: ["name", "permissions"],
  properties: {
    name: { type: "string", maxLength: 60, example: "Coordenador" },
    description: {
      type: ["string", "null"],
      maxLength: 255,
      example: "Tria e redistribui qualquer solicitação",
    },
    isAssignableTriage: { type: "boolean", example: true },
    isAssignableMapping: { type: "boolean", example: false },
    permissions: {
      type: "array",
      items: { $ref: "#/components/schemas/ProfilePermission" },
      example: [
        { key: "request:read", custody: "all" },
        { key: "request:assign", custody: "all" },
        { key: "request:status_change", custody: "all" },
        { key: "request:status_override", custody: "global" },
        { key: "queue:read", custody: "all" },
        { key: "triage:read", custody: "all" },
        { key: "triage:write", custody: "all" },
        { key: "assignee_directory:read", custody: "global" },
      ],
    },
  },
};

export const ProfileUpdateRequest = {
  type: "object",
  description:
    "Edição parcial e atômica. Campo ausente é intocado; `permissions` presente substitui a composição inteira.",
  properties: {
    name: { type: "string", maxLength: 60, example: "Coordenador" },
    description: { type: ["string", "null"], maxLength: 255, example: "Nova descrição" },
    isAssignableTriage: { type: "boolean", example: true },
    isAssignableMapping: { type: "boolean", example: false },
    permissions: {
      type: "array",
      description: "Presente substitui integralmente; nunca faz merge.",
      items: { $ref: "#/components/schemas/ProfilePermission" },
    },
  },
};

export const ProfileStatusRequest = {
  type: "object",
  required: ["isActive"],
  properties: {
    isActive: { type: "boolean", example: false },
  },
};

export const ProfileStatusResponse = {
  type: "object",
  required: ["id", "isActive"],
  properties: {
    id: { type: "string", example: "6" },
    isActive: { type: "boolean", example: false },
  },
};

export const ProfileDuplicateRequest = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", maxLength: 60, example: "Coordenador (cópia)" },
    description: {
      type: ["string", "null"],
      maxLength: 255,
      description: "Quando ausente, herda a descrição do Perfil de origem.",
    },
  },
};
