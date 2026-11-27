import Config from "../../src/configs.ts";
import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";

/**
 * Conta Admin Root — única e criada apenas por este seed, a partir de
 * variáveis de ambiente (contrato RBAC § 4.2). Nunca sobrescreve a conta
 * existente; sem as variáveis, pula a criação com aviso.
 *
 * A conta nasce com troca de senha obrigatória no primeiro login. A extensão
 * de solicitante (1:1) é criada sob demanda pelo fluxo da primeira solicitação,
 * como nas demais contas semeadas.
 *
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  const rootProfile = await knex("profiles").where({ is_root: true }).first("profile_id");

  if (!rootProfile) {
    throw new Error("Perfil Admin Root não encontrado. Rode o seed dos perfis base primeiro.");
  }

  const existingRootAccount = await knex("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("p.is_root", true)
    .first("u.user_id");

  if (existingRootAccount) {
    console.log("[seed] Conta Admin Root já existe — não sobrescrita.");
    return;
  }

  const email = Config.ADMIN_ROOT_EMAIL?.trim().toLowerCase();
  const password = Config.ADMIN_ROOT_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[seed] ADMIN_ROOT_EMAIL/ADMIN_ROOT_PASSWORD ausentes — conta Admin Root não criada.",
    );
    return;
  }

  const emailInUse = await knex("users").where({ email }).first("user_id");

  if (emailInUse) {
    console.warn(
      "[seed] O e-mail configurado para o Admin Root já pertence a outra conta — conta não criada.",
    );
    return;
  }

  const passwordHash = await hashPassword(password);

  await knex("users").insert({
    full_name: Config.ADMIN_ROOT_NAME?.trim() || "Admin Root",
    email,
    password_hash: passwordHash,
    profile_id: rootProfile.profile_id,
    must_change_password: true,
  });

  console.log("[seed] Conta Admin Root criada com troca de senha obrigatória.");
}
