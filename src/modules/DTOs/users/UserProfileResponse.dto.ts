import type { Role } from "../../../shared/types/role.ts";

/** Resposta de `GET /users/me` — perfil completo do próprio usuário. */
export interface UserProfileResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  requester: RequesterProfileBlock | null;
  professional: ProfessionalProfileBlock | null;
}

/** Bloco de dados de solicitante editável no "Meus dados". */
export interface RequesterProfileBlock {
  area: string | null;
  department: string | null;
  manager: string | null;
  additionalContact: string | null;
}

/** Bloco de dados profissionais editável no "Meus dados" (apenas analista). */
export interface ProfessionalProfileBlock {
  jobTitle: string | null;
  specialties: string[];
  attendedCategoryIds: number[];
  notes: string | null;
}
