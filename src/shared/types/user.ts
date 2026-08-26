import type { Role } from "./role.ts";

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: Role;
}

export type AuthenticatedUser = Omit<User, "password">;
export type UserRequestDTO = Omit<User, "id">