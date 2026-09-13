import type { Role } from "../../../shared/types/role.ts";

export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}
