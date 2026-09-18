const DEMO_MARKER = "dashboard.demo@maat.local";
const REQUEST_COUNT = 48;

function addUtcDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function openedAtFor(index, now) {
  const monthsAgo = 11 - Math.floor(index / 4);
  const day = [2, 7, 12, 17][index % 4];
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, day, 15, 0, 0));
}

export async function seed(knex) {
  await knex.transaction(async (trx) => {
    await trx("requests").where({ created_by: DEMO_MARKER }).del();

    const templates = await trx("requests")
      .whereNot({ created_by: DEMO_MARKER })
      .orderBy("request_id", "asc")
      .limit(20);

    if (templates.length === 0) {
      throw new Error(
        "O cenário de dashboard requer as seeds-base. Rode `npm run seed:run` primeiro.",
      );
    }

    const statuses = await trx("statuses")
      .select("status_id", "closes_request")
      .orderBy("order_number", "asc");
    const categories = await trx("categories")
      .select("category_id")
      .orderBy("display_order", "asc");
    const priorities = await trx("priorities").select("priority_id").orderBy("min_score", "asc");
    const professionals = await trx("details_professional")
      .select("professional_id")
      .where({ status: "active" })
      .orderBy("professional_id", "asc");

    if (statuses.length === 0 || categories.length === 0 || priorities.length === 0) {
      throw new Error("Dados de referência ausentes. Rode as migrations e as seeds-base primeiro.");
    }

    const now = new Date();
    const priorityIds = [null, ...priorities.map((priority) => priority.priority_id)];
    const professionalIds = [null, ...professionals.map((item) => item.professional_id)];

    const rows = Array.from({ length: REQUEST_COUNT }, (_, index) => {
      const template = templates[index % templates.length];
      const base = { ...template };
      delete base.request_id;
      const status = statuses[index % statuses.length];
      const openedAt = openedAtFor(index, now);
      const updatedAtCandidate = addUtcDays(openedAt, 3 + (index % 18));
      const updatedAt = updatedAtCandidate > now ? now : updatedAtCandidate;
      const isOverdueExample = !status.closes_request && index % 3 === 0;
      const desiredDeadline = isOverdueExample
        ? addUtcDays(now, -(3 + (index % 45)))
        : addUtcDays(now, 15 + (index % 75));
      const sequence = String(index + 1).padStart(3, "0");

      return {
        ...base,
        protocol: `MAAT-D${sequence}-${String(1001 + index)}`,
        title: `[DEMO] ${template.title} — cenário ${sequence}`,
        category_id: categories[index % categories.length].category_id,
        status_id: status.status_id,
        priority_id: priorityIds[(index * 2 + Math.floor(index / 10)) % priorityIds.length],
        professional_id: professionalIds[(index * 3) % professionalIds.length],
        desired_deadline: toDateOnly(desiredDeadline),
        estimated_completion: toDateOnly(addUtcDays(desiredDeadline, 10)),
        meeting_scheduled_for: null,
        meeting_link: null,
        created_by: DEMO_MARKER,
        created_at: openedAt,
        updated_by: DEMO_MARKER,
        updated_at: updatedAt,
        last_external_update_at: updatedAt,
      };
    });

    await trx("requests").insert(rows);
    await trx.raw(
      "SELECT setval('requests_request_seq', (SELECT COALESCE(MAX(request_id), 1) FROM requests))",
    );
  });
}
