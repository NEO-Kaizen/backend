import type { RequestCategoryName } from "../../../shared/types/requests.ts";
import type { ProfileReference } from "../../../shared/types/profile.ts";

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  profile: ProfileReference;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AssignableProfessional {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  categories: RequestCategoryName[];
  notes: string | null;
  requestLoad: number;
}

export interface CreateUserResponse extends Omit<UserSummary, "avatarUrl"> {
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
