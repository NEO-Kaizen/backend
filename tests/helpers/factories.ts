import jwt from "jsonwebtoken";
import type { AuthUserRow, UserRow } from "../../src/shared/types/user.ts";
import type { AuthState } from "../../src/modules/auth/auth.repository.ts";
import type { Role } from "../../src/shared/types/role.ts";
import { generateToken, type TokenPayload } from "../../src/shared/utils/jwtUtil.ts";
import type { CriterionRow } from "../../src/shared/types/prioritization.ts";
import type { LoginResponseDTO } from "../../src/modules/DTOs/auth/LoginResponse.dto.ts";
import type { CreateRequestPayload } from "../../src/modules/DTOs/requests/RequestRequests.dto.ts";
import type { CreateRequestResponse } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";
import type { TrackingDetailsResponse } from "../../src/modules/DTOs/requests/RequestTracking.dto.ts";
import type { AssignAnalyst, UserSummary } from "../../src/modules/DTOs/users/UserResponse.dto.ts";
import type { UserProfileResponseDTO } from "../../src/modules/DTOs/users/UserProfileResponse.dto.ts";
import type { PaginatedResponse } from "../../src/shared/types/pagination.ts";
import Config from "../../src/configs.ts";

export const PROFILE_IDS: Record<Role, number> = {
  Solicitante: 1,
  Analista: 2,
  Administrador: 3,
  Gestor: 4,
};

const PROFILE_NAMES: Record<Role, string> = {
  Solicitante: "solicitante",
  Analista: "analista",
  Gestor: "gestor",
  Administrador: "administrador",
};

/** Linha completa de `users` (retorno direto do Knex). */
export function makeUserRow(overrides: Partial<UserRow> = {}): UserRow {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    user_id: 1,
    full_name: "Usuário de Teste",
    email: "teste@neo.com",
    avatar_url: null,
    password_hash: "$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvwxyz01234",
    profile_id: PROFILE_IDS.Analista,
    is_active: true,
    must_change_password: false,
    password_changed_at: now,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/** Linha completa de autenticação (`users` JOIN `profiles`). */
export function makeAuthUser(overrides: Partial<AuthUserRow> = {}): AuthUserRow {
  const profileName = overrides.profile_name ?? "analista";
  const role =
    (Object.keys(PROFILE_NAMES) as Role[]).find((key) => PROFILE_NAMES[key] === profileName) ??
    "Analista";

  return {
    ...makeUserRow({
      profile_id: overrides.profile_id ?? PROFILE_IDS[role],
    }),
    profile_name: profileName,
    profile_is_active: true,
    ...overrides,
  };
}

/** Corpo de login/`GET /auth/me` com todos os campos do contrato. */
export function makeSessionResponse(overrides: Partial<LoginResponseDTO> = {}): LoginResponseDTO {
  return {
    id: "1",
    name: "Usuário de Teste",
    email: "teste@neo.com",
    avatarUrl: null,
    role: "Analista",
    mustChangePassword: false,
    ...overrides,
  };
}

/** Estado de autenticação lido pelo `authMiddleware` a cada request. */
export function makeAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    is_active: true,
    profile_is_active: true,
    profile_name: "analista",
    must_change_password: false,
    password_changed_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

/** Payload de JWT padrão, casando com um `AuthState` emitido no mesmo instante. */
export function makeTokenPayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    id: "1",
    name: "Usuário de Teste",
    email: "teste@neo.com",
    role: "Analista",
    password_changed_at: new Date("2026-01-01T00:00:00.000Z").getTime(),
    scope: "session",
    ...overrides,
  };
}

/** Emite um JWT real (assinado com `JWT_SECRET` dos testes). */
export function makeToken(overrides: Partial<TokenPayload> = {}): string {
  return generateToken(makeTokenPayload(overrides));
}

/** JWT já expirado — para o caminho `TokenExpiredError` do middleware. */
export function makeExpiredToken(overrides: Partial<TokenPayload> = {}): string {
  const secret = Config.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET ausente no ambiente de teste");

  return jwt.sign(makeTokenPayload(overrides), secret, { expiresIn: -1 });
}

/** JWT com assinatura adulterada (sufixo extra invalida a assinatura sempre). */
export function makeTamperedToken(overrides: Partial<TokenPayload> = {}): string {
  return `${makeToken(overrides)}x`;
}

/** Payload válido de `POST /requests` (multipart, parte `payload`). */
export function makeRequestPayload(): CreateRequestPayload {
  return {
    requester: {
      fullName: "Maria Solicitante",
      corporateEmail: "maria@neo.com",
      area: "Financeiro",
      department: "Contas a Pagar",
      manager: "Carlos Gestor",
      additionalContact: "11999999999",
    },
    demand: {
      title: "Automatizar conciliação",
      requestType: "Automação",
      category: "Automação",
      processName: "Conciliação bancária",
      description: "Descrição detalhada do processo e do problema.",
      problem: "Processo manual e sujeito a erros.",
      expectedResult: "Conciliação automática diária.",
      justification: "Reduzir esforço manual e erros.",
    },
    operational: {
      processDescription: "Descrição operacional do processo.",
      processSteps: "Passo 1, passo 2 e passo 3.",
      systemsUsed: "ERP, planilhas",
      executionFrequency: "Diário",
      volumetry: "500 lançamentos/dia",
      peopleInvolved: 3,
      averageExecutionTime: "2h",
      monthlyEffortHours: 40,
      hasManualControls: "Controle em planilha",
      mainRisks: "Erros de digitação.",
      clientImpact: "Impacto baixo.",
      operationalImpact: "Médio",
      desiredDeadline: "2099-12-31",
      perceivedCriticality: "Alta",
    },
    complementary: {
      hasProcessDocumentation: "Documentado em SOP",
      hasSimilarSolution: false,
      dependsOnOtherAreas: "Depende de TI",
      handlesRestrictedInfo: false,
      additionalNotes: "Observações adicionais.",
    },
    schedulePreferences: ["2099-12-30T10:00", "2099-12-31T14:00"],
  };
}

/** Resposta de sucesso de `POST /requests` com contrato completo. */
export function makeCreateRequestResponse(
  overrides: Partial<CreateRequestResponse> = {},
): CreateRequestResponse {
  return {
    protocol: "MAAT-ABCD-EFGH",
    status: "Solicitação enviada",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Resposta pública de `GET /requests/:protocol/tracking`. */
export function makeTrackingResponse(
  overrides: Partial<Extract<TrackingDetailsResponse, { mode: "public" }>["details"]> = {},
): TrackingDetailsResponse {
  return {
    mode: "public",
    details: {
      protocol: "MAAT-ABCD-EFGH",
      status: "Em triagem",
      openedAt: "2026-01-01T00:00:00.000Z",
      lastUpdate: "2026-01-02T00:00:00.000Z",
      lastTechnicalMessage: null,
      meeting: null,
      requester: {
        fullName: "Maria Solicitante",
        corporateEmail: "maria@neo.com",
        area: "Financeiro",
        department: "Contas a Pagar",
        manager: "Carlos Gestor",
        additionalContact: "11999999999",
      },
      demand: {
        title: "Automatizar conciliação",
        requestType: "Automação",
        category: "Automação",
        processName: "Conciliação bancária",
        description: "Descrição detalhada do processo.",
        problem: "Processo manual.",
        expectedResult: "Conciliação automática.",
        justification: "Reduzir esforço.",
      },
      impacts: {
        mainRisks: "Erros manuais.",
        clientImpact: "Baixo.",
        operationalImpact: "Médio",
        perceivedCriticality: "Alta",
        desiredDeadline: "2099-12-31",
      },
      ...overrides,
    },
  };
}

export function makeUserSummary(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: "1",
    fullName: "Usuário de Teste",
    email: "teste@neo.com",
    avatarUrl: null,
    profile: "Analista",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeAnalyst(overrides: Partial<AssignAnalyst> = {}): AssignAnalyst {
  return {
    id: "2",
    fullName: "Ana Analista",
    email: "ana@neo.com",
    specialty: "Automação",
    categories: ["Automação"],
    notes: null,
    requestLoad: 0,
    ...overrides,
  };
}

export function makeUserProfile(
  overrides: Partial<UserProfileResponseDTO> = {},
): UserProfileResponseDTO {
  return {
    id: "7",
    fullName: "Maria",
    email: "maria@neo.com",
    role: "Solicitante",
    avatarUrl: null,
    requester: {
      area: "Financeiro",
      department: null,
      manager: "Gestor",
      additionalContact: null,
    },
    professional: null,
    ...overrides,
  };
}

export function makeUserPage(
  overrides: Partial<PaginatedResponse<UserSummary>> = {},
): PaginatedResponse<UserSummary> {
  return {
    data: [makeUserSummary()],
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

/** Os 10 critérios oficiais da RN-007, com pesos padrão. */
export function makeCriteria(weights: number[] = Array(10).fill(5)): CriterionRow[] {
  return Array.from({ length: 10 }, (_, index) => ({
    criterion_id: `criterion_${index + 1}`,
    name: `Critério ${index + 1}`,
    weight: weights[index] ?? 5,
    active: true,
    display_order: index + 1,
  }));
}
