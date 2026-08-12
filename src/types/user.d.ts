import type { Role } from "../shared/types/role.ts";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
}
