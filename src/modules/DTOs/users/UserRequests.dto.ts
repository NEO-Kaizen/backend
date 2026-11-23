export interface CreateProfessionalInput {
  /** Cargo profissional do usuário atribuível (vira `job_title` → `specialty` no card). */
  jobTitle: string;
  /** Especialidades (vira `specialties`, texto separado por vírgula). */
  specialties: string[];
  /** Ids das categorias atendidas (vira `attended_category_ids`). */
  attendedCategoryIds: number[];
  notes?: string;
}

export interface RequesterInput {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string | null;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: string;
  /** Obrigatório para Perfil atribuível; proibido para os demais Perfis. */
  professional?: CreateProfessionalInput;
  requester: RequesterInput;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: string;
  professional?: CreateProfessionalInput;
  requester?: {
    area?: string;
    department?: string | null;
    manager?: string;
    additionalContact?: string | null;
  };
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
