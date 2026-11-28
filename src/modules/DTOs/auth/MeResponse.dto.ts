import type { ProfileReference } from "../../../shared/types/profile.ts";
import type { EffectivePermission } from "../../../shared/catalog/permissionCatalog.ts";

export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profile: ProfileReference;
  mustChangePassword: boolean;
  /** Lista efetiva do Perfil vigente, na ordem do catálogo de Permissões (§ 8). */
  permissions: EffectivePermission[];
}
