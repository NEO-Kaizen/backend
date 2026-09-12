export interface CreateRequesterRequest {
  fullName: string;
  email: string;
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
