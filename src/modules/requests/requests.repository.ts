import db from "../../database/conection.ts";

export async function findByProtocol(protocol: string) {
  const request = await db("requests")
    .where({ "requests.protocol": protocol })
    .leftJoin("requesters", "requesters.requester_id", "requests.requester_id")
    .leftJoin("categories", "categories.category_id", "requests.category_id")
    .leftJoin("statuses", "statuses.status_id", "requests.status_id")
    .leftJoin("priorities", "priorities.priority_id", "requests.priority_id")
    .leftJoin("professionals", "professionals.professional_id", "requests.professional_id")
    .select(
      "requests.request_id",
      "requests.protocol",
      "requests.title",
      "requests.request_type",
      "requests.process_name",
      "requests.need_description",
      "requests.problem_opportunity",
      "requests.expected_result",
      "requests.justification",
      "requests.process_description",
      "requests.process_steps",
      "requests.systems_used",
      "requests.execution_frequency",
      "requests.approximate_volume",
      "requests.people_involved",
      "requests.average_duration",
      "requests.estimated_monthly_effort",
      "requests.has_manual_controls",
      "requests.manual_controls_detail",
      "requests.main_risks",
      "requests.client_impact",
      "requests.operational_impact",
      "requests.desired_deadline",
      "requests.perceived_criticality",
      "requests.has_process_documentation",
      "requests.process_documentation_detail",
      "requests.has_similar_solution",
      "requests.similar_solution_detail",
      "requests.depends_on_other_areas",
      "requests.other_areas_detail",
      "requests.handles_restricted_info",
      "requests.restricted_info_detail",
      "requests.additional_notes",
      "requests.priority_score",
      "requests.internal_notes",
      "requests.created_at",
      "requests.updated_at",
      "categories.name as category",
      "statuses.name as status",
      "priorities.level as priority",
      "professionals.full_name as professional_name",
      "professionals.email as professional_email",
      "requesters.full_name as requester_name",
      "requesters.corporate_email as requester_email",
      "requesters.area as requester_area",
      "requesters.department as requester_department",
      "requesters.manager_name as requester_manager",
      "requesters.additional_contact as requester_additional_contact",
    )
    .first();

  return request ?? null;
}

export async function findAttachmentsByRequestId(requestId: string | number) {
  return db("attachments")
    .where({ request_id: requestId })
    .select("file_name", "content_type", "size_bytes", "is_restricted")
    .orderBy("uploaded_at", "asc");
}

export async function findSchedulePreferencesByRequestId(requestId: string | number) {
  return db("request_time_preferences")
    .where({ request_id: requestId })
    .select("scheduled_for")
    .orderBy("scheduled_for", "asc");
}
