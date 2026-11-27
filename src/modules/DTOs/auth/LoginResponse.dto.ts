import type { ProfileReference } from "../../../shared/types/profile.ts";

export interface LoginResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profile: ProfileReference;
  mustChangePassword: boolean;
}
