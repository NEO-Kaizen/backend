import type { Role } from "../../../shared/types/role.ts";

export interface LoginResponseDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}
