import type { Role } from "../../../shared/types/role.ts";
import type { RequestCategory } from "../../../shared/types/requests.ts";

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

export interface AssignableProfessional {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  categories: RequestCategory[];
  notes: string | null;
  requestLoad: number | null;
}

/** Aliases de compatibilidade para o endpoint legado `/users/analysts`. */
export type AssignAnalyst = AssignableProfessional;
export type Analyst = AssignableProfessional;

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
