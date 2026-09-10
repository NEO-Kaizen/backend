export async function seed(knex) {
  await knex("protocol_sequences").insert([
    {
      year: 2026,
      prefix: "MAAT",
      last_number: 2,
      updated_at: "2026-07-02 10:30:00",
    },
  ]);
}
