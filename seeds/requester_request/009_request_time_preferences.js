export async function seed(knex) {
  await knex("request_time_preferences").insert([
    { request_id: 1, scheduled_for: "2026-09-02 08:00:00" },
    { request_id: 1, scheduled_for: "2026-09-02 10:00:00" },
    { request_id: 1, scheduled_for: "2026-09-03 14:00:00" },
  ]);
}
