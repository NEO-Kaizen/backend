import type { RequestCategory } from "../../../shared/types/requests.ts";

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  profile: string;
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

export interface CreateUserResponse extends Omit<UserSummary, "profile" | "avatarUrl"> {
  /** Nome de exibição do Perfil vigente. */
  role: string;
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
