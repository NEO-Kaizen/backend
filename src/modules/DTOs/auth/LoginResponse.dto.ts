import type { SessionProfileReference } from "../../../shared/types/profile.ts";

export interface LoginResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profile: SessionProfileReference;
  mustChangePassword: boolean;
}
