import type { EffectivePermission } from "../../../shared/catalog/permissionCatalog.ts";

export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  mustChangePassword: boolean;
  /** Lista efetiva do Perfil vigente, na ordem do catálogo de Permissões (§ 8). */
  permissions: EffectivePermission[];
}
