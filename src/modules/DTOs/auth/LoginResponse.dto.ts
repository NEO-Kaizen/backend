export interface LoginResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  mustChangePassword: boolean;
}
