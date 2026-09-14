import type { Role } from "../../../shared/types/role.ts";

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  profile: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateUserResponse extends Omit<UserSummary, "profile"> {
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
