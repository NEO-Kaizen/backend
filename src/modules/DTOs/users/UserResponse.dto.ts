import type { Role } from "../../../shared/types/role.ts";
import type { RequestCategoryName } from "../../../shared/types/requests.ts";

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  profile: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AssignAnalyst {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  categories: RequestCategoryName[];
  notes: string | null;
  requestLoad: number | null;
}

// compat alias — as regras em `docs/rules/assignment.md` usam AssignAnalyst;
// manter `Analyst` como alias até remover usos legados
export type Analyst = AssignAnalyst;

export interface CreateUserResponse extends Omit<UserSummary, "profile" | "avatarUrl"> {
  /** Vocabulário de exibição — capitalizado (ex.: "Analista"). */
  role: Role;
  /** Exibida uma única vez — não recuperável depois. */
  temporaryPassword: string;
}

export interface ResetPasswordResponse {
  id: string;
  temporaryPassword: string;
}

export interface ChangeUserStatusResponse {
  id: string;
  isActive: boolean;
}
