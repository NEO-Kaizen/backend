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

export interface AssignAnalyst {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  categories: RequestCategory[];
  notes: string | null;
  requestLoad: number | null;
}

// compat alias — contrato contract-assign-action.md usa AssignAnalyst; manter Analyst como alias até remover usos legados
export type Analyst = AssignAnalyst;

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
