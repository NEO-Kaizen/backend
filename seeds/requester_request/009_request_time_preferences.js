export async function seed(knex) {
  await knex("request_time_preferences").insert([
    { request_id: 7, scheduled_for: "2026-09-08 10:00:00" },
    { request_id: 7, scheduled_for: "2026-09-08 14:00:00" },
    { request_id: 7, scheduled_for: "2026-09-10 09:00:00" },
    { request_id: 8, scheduled_for: "2026-09-20 14:00:00" },
    { request_id: 8, scheduled_for: "2026-09-21 09:00:00" },
    { request_id: 9, scheduled_for: "2026-09-15 11:00:00" },
    { request_id: 9, scheduled_for: "2026-09-16 09:30:00" },
    { request_id: 10, scheduled_for: "2026-09-22 10:30:00" },
    { request_id: 10, scheduled_for: "2026-09-23 15:00:00" },
    { request_id: 11, scheduled_for: "2026-09-24 09:00:00" },
    { request_id: 12, scheduled_for: "2026-09-25 14:30:00" },
    { request_id: 14, scheduled_for: "2026-10-01 10:00:00" },
    { request_id: 17, scheduled_for: "2026-10-06 09:00:00" },
    { request_id: 18, scheduled_for: "2026-10-05 15:00:00" },
    { request_id: 19, scheduled_for: "2026-10-09 11:00:00" },
  ]);
}
