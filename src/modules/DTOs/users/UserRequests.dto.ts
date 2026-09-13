export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: string;
}

export interface ListUsersQuery {
  profile?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ChangeUserStatusRequest {
  isActive: boolean;
}
