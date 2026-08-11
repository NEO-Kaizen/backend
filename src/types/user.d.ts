// src/types/user.ts
export interface UserPayload {
  id: string | number;
  name: string;
  email: string;
  sessionToken: string;
}

export interface User {
  email: string;
  password: string;
}
