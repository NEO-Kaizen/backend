/** Resposta de `GET /users/me` e `GET /users/:id` — perfil completo. */
export interface UserProfileResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  requester: RequesterProfileBlock | null;
  professional: ProfessionalProfileBlock | null;
}

/** Bloco de dados de solicitante; somente additionalContact é autoeditável. */
export interface RequesterProfileBlock {
  area: string | null;
  department: string | null;
  manager: string | null;
  additionalContact: string | null;
}

/** Bloco de dados profissionais do usuário atribuível. */
export interface ProfessionalProfileBlock {
  jobTitle: string | null;
  specialties: string[];
  attendedCategoryIds: number[];
  notes: string | null;
}
