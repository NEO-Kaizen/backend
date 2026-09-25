import type { Role } from "../../../shared/types/role.ts";

export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
}
