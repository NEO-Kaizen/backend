import { hashPassword } from "../../src/shared/utils/passwordHandler.ts";

export async function seed(knex) {
  const profiles = await knex("profiles").select("profile_id", "name");
  const profileIdByName = new Map(profiles.map((p) => [p.name, p.profile_id]));

  const requireProfile = (name) => {
    const id = profileIdByName.get(name);
    if (!id) throw new Error(`Perfil '${name}' não encontrado. Rode as migrations primeiro.`);
    return id;
  };

  // Senha padrão de desenvolvimento — documentada no README.
  const passwordHash = await hashPassword("steste123");

  await knex("users")
    .insert([
      {
        user_id: 101,
        full_name: "Analista Teste",
        email: "analista_teste@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("analista"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 102,
        full_name: "Administrador Teste",
        email: "administrador_teste@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("administrador"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 103,
        full_name: "Gestor Teste",
        email: "gestor_teste@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("gestor"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 104,
        full_name: "Solicitante Teste",
        email: "solicitante_teste@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("solicitante"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 105,
        full_name: "Solicitante Inativo",
        email: "solicitante_inativo@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("solicitante"),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 106,
        full_name: "Ana Gestora",
        email: "ana.gestora@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("gestor"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 107,
        full_name: "Roberta Analista",
        email: "roberta.analista@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("analista"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 108,
        full_name: "Bruno Analista",
        email: "bruno.analista@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("analista"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 109,
        full_name: "Carina Admin",
        email: "carina.admin@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("administrador"),
        is_active: true,
        must_change_password: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 110,
        full_name: "Diego Analista",
        email: "diego.analista@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("analista"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 111,
        full_name: "Elisa Gestora",
        email: "elisa.gestora@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("gestor"),
        is_active: true,
        must_change_password: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 112,
        full_name: "Fabio Solicitante",
        email: "fabio.solicitante@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("solicitante"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 113,
        full_name: "Gisela Solicitante",
        email: "gisela.solicitante@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("solicitante"),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 114,
        full_name: "Hugo Analista",
        email: "hugo.analista@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("analista"),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 115,
        full_name: "Ines Admin",
        email: "ines.admin@email.com",
        password_hash: passwordHash,
        profile_id: requireProfile("administrador"),
        is_active: true,
        must_change_password: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .onConflict("user_id")
    .ignore();

  await knex("requesters").insert({
    requester_id: "550e8400-e29b-41d4-a716-446655440016",
    full_name: "Solicitante Teste",
    corporate_email: "solicitante_teste@email.com",
    user_id: 104,
    area: "Compras",
    department: "Suprimentos",
    manager_name: "Mariana Costa",
    additional_contact: "(11) 95555-1111",
    created_at: new Date(),
  });

  await knex.raw(
    "SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users))",
  );
}
