import type { AuthUserRow } from "../../src/shared/types/user.ts";
import type { AuthState } from "../../src/modules/auth/auth.repository.ts";
import type { Role } from "../../src/shared/types/role.ts";
import { generateToken, type TokenPayload } from "../../src/shared/utils/jwtUtil.ts";
import type { CriterionRow } from "../../src/shared/types/prioritization.ts";

const PROFILE_NAMES: Record<Role, string> = {
  Solicitante: "solicitante",
  Analista: "analista",
  Gestor: "gestor",
  Administrador: "administrador",
};

/** Linha completa de autenticação (`users` JOIN `profiles`). */
export function makeAuthUser(overrides: Partial<AuthUserRow> = {}): AuthUserRow {
  const role: Role = overrides.profile_name
    ? ((Object.keys(PROFILE_NAMES).find(
        (key) => PROFILE_NAMES[key as Role] === overrides.profile_name,
      ) as Role) ?? "Solicitante")
    : "Analista";
  const profileName = overrides.profile_name ?? PROFILE_NAMES[role];
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    user_id: 1,
    full_name: "Usuário de Teste",
    email: "teste@neo.com",
    avatar_url: null,
    password_hash: "$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvwxyz01234",
    profile_id: 2,
    is_active: true,
    must_change_password: false,
    password_changed_at: now,
    created_at: now,
    updated_at: now,
    profile_name: profileName,
    profile_is_active: true,
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

/** Payload válido de `POST /requests` (multipart, parte `payload`). */
export function makeRequestPayload() {
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
      desiredDeadline: "2030-12-31",
      perceivedCriticality: "Alta",
    },
    complementary: {
      hasProcessDocumentation: "Documentado em SOP",
      hasSimilarSolution: false,
      dependsOnOtherAreas: "Depende de TI",
      handlesRestrictedInfo: false,
      additionalNotes: "Observações adicionais.",
    },
    schedulePreferences: ["2030-12-30T10:00", "2030-12-31T14:00"],
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
