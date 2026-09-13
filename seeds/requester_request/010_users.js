import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";

export async function seed(knex) {
  await knex("users")
    .insert([
      {
        user_id: 101,
        full_name: "Analista Teste",
        email: "analista_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 102,
        full_name: "Administrador Teste",
        email: "administrador_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 103,
        full_name: "Gestor Teste",
        email: "gestor_teste@email.com",
        password_hash: await hashPassword("steste123"),
        profile_id: 4,
        is_active: true,
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
