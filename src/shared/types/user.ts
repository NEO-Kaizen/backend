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

/** Linha de autenticação com JOIN em `profiles` — fonte da verdade para papel e status. */
export interface AuthUserRow extends UserRow {
  profile_name: string;
  profile_is_active: boolean;
}

/** Métricas consolidadas da base de usuários — retorno de `GET /users/metrics`. */
export interface UserMetricsResponse {
  total: number;
  active: number;
  pending: number;
  admins: number;
}
