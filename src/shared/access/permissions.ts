import {
  buildEffectivePermissions,
  type EffectivePermission,
} from "../catalog/permissionCatalog.ts";
import { listUserPermissions } from "../../modules/auth/auth.repository.ts";

/**
 * Lista efetiva de Permissões do ator, recalculada do banco a cada requisição —
 * o Perfil vem do banco, nunca do token. Consumida pelo gate de chave e pelas
 * rotas que resolvem autoridade sem gate de uma chave só (ex.: visão
 * administrativa do portal).
 *
 * Dívida deliberada (ticket 06 — contração, #167): a consulta vive aqui e é
 * importada de `modules/auth` (direção shared → modules) enquanto o guard por
 * nome não morre; depois, carregar uma vez por requisição no `authMiddleware`.
 */
export async function loadEffectivePermissions(userId: number): Promise<EffectivePermission[]> {
  const grants = await listUserPermissions(userId);
  return buildEffectivePermissions(grants);
}
