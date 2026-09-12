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

export interface CreateRequesterResponse extends UserSummary {
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
