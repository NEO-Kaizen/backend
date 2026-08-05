export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserDTO {
  name: string
  email: string
  password: string
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
}

export interface UserResponse {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}
