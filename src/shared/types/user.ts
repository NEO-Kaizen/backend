import type { Role } from "./role.ts";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
}

export type AuthenticatedUser = Omit<User, "password">;
