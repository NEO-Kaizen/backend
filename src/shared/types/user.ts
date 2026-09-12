import type { Role } from "./role.ts";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
}

export type AuthenticatedUser = Omit<User, "password">;
export type UserRequestDTO = Omit<User, "id">;

/** Linha da tabela `users` — retorno direto do Knex. */
export interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  profile_id: number;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at: Date;
  created_at: Date;
  updated_at: Date;
}
