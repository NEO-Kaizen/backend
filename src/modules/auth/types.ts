export interface LoginDTO {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    name: string
    email: string
  }
  token: string
}
