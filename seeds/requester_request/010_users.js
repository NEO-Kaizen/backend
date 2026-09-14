import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";

export async function seed(knex) {
  const profiles = await knex("profiles").select("profile_id", "name");
  const profileIdByName = new Map(profiles.map((p) => [p.name, p.profile_id]));

  const requireProfile = (name) => {
    const id = profileIdByName.get(name);
    if (!id) throw new Error(`Perfil '${name}' não encontrado. Rode as migrations primeiro.`);
    return id;
  };

  await knex("users")
    .insert([
      {
        user_id: 101,
        full_name: "Analista Teste",
        email: "analista_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: requireProfile("analista"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 102,
        full_name: "Administrador Teste",
        email: "administrador_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: requireProfile("administrador"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 103,
        full_name: "Gestor Teste",
        email: "gestor_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: requireProfile("gestor"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 104,
        full_name: "Solicitante Teste",
        email: "solicitante_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: requireProfile("solicitante"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 105,
        full_name: "Solicitante Inativo",
        email: "solicitante_inativo@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: requireProfile("solicitante"),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .onConflict("user_id")
    .ignore();

  await knex.raw(
    "SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users))",
  );
}
