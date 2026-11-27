/**
 * Garante no banco que exista no máximo uma conta com o Perfil Admin Root.
 *
 * O índice parcial `uk_profiles_single_root` limita o Perfil marcado como root
 * a um registro; este trigger limita as contas associadas a ele. Cobre também
 * inserção direta e seeds concorrentes: o advisory lock serializa as
 * transações e a checagem acontece depois do commit da concorrente.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION enforce_single_root_account() RETURNS trigger
    LANGUAGE plpgsql AS $$
    DECLARE
      root_profile_id integer;
      other_root_user_id integer;
    BEGIN
      SELECT profile_id INTO root_profile_id FROM profiles WHERE is_root LIMIT 1;

      IF root_profile_id IS NULL OR NEW.profile_id <> root_profile_id THEN
        RETURN NEW;
      END IF;

      -- Serializa concorrentes: a segunda transação só checa após o commit da primeira.
      PERFORM pg_advisory_xact_lock(hashtext('enforce_single_root_account'));

      SELECT user_id INTO other_root_user_id
      FROM users
      WHERE profile_id = root_profile_id
        AND user_id IS DISTINCT FROM NEW.user_id
      LIMIT 1;

      IF other_root_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Já existe uma conta Admin Root'
          USING ERRCODE = '23505',
                CONSTRAINT = 'trg_users_single_root';
      END IF;

      RETURN NEW;
    END;
    $$;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_users_single_root
    BEFORE INSERT OR UPDATE OF profile_id ON users
    FOR EACH ROW EXECUTE FUNCTION enforce_single_root_account();
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw("DROP TRIGGER IF EXISTS trg_users_single_root ON users");
  await knex.raw("DROP FUNCTION IF EXISTS enforce_single_root_account()");
}
