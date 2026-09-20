import type { Knex } from "knex";
import db from "../../../database/conection.ts";
import type { TriageAssessment } from "./triage.schema.ts";

interface StatusRow {
  status_id: number;
  name: string;
}

interface CategoryRow {
  category_id: number;
  name: string;
}

interface RequestContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  assignee_user_id: number | null;
  internal_notes: string | null;
}

export async function findRequestContext(protocol: string): Promise<RequestContextRow | undefined> {
  return db("requests as r")
    .leftJoin("details_professional as dp", "dp.professional_id", "r.professional_id")
    .where("r.protocol", protocol)
    .first({
      request_id: "r.request_id",
      protocol: "r.protocol",
      professional_id: "r.professional_id",
      assignee_user_id: "dp.user_id",
      internal_notes: "r.internal_notes",
    });
}

function isTriageAssessment(value: unknown): value is TriageAssessment {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Partial<TriageAssessment>;

  return (
    (typeof record.id === "string" || typeof record.id === "undefined") &&
    typeof record.adherentToScope === "string" &&
    typeof record.adherentJustification === "string" &&
    typeof record.changeCategory === "string" &&
    typeof record.newCategory === "string" &&
    typeof record.preliminaryComplexity === "string" &&
    typeof record.perceivedRisks === "string" &&
    typeof record.suggestedResponsible === "string" &&
    typeof record.suggestedResponsibleJustification === "string" &&
    typeof record.exitStatus === "string" &&
    typeof record.result === "string" &&
    typeof record.conclusionJustification === "string"
  );
}

export async function findTriageByProtocol(protocol: string): Promise<TriageAssessment | null> {
  const row = await db("requests")
    .where({ protocol })
    .first("internal_notes");

  if (!row?.internal_notes) {
    return null;
  }

  try {
    const parsed = JSON.parse(String(row.internal_notes));
    return isTriageAssessment(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function resolveExitStatus(value: string): Promise<StatusRow | undefined> {
  const raw = value.trim();
  if (!raw) return undefined;

  const query = db("statuses")
    .where({ is_active: true, is_triage_exit: true })
    .where((builder) => {
      builder.where("status_id", Number(raw)).orWhere("name", raw);
    })
    .first("status_id as status_id", "name");

  return query as Promise<StatusRow | undefined>;
}

export async function resolveCategoryId(value: string): Promise<CategoryRow | undefined> {
  const raw = value.trim();
  if (!raw) return undefined;

  const query = db("categories")
    .where("category_id", Number(raw))
    .orWhere("name", raw)
    .first("category_id as category_id", "name");

  return query as Promise<CategoryRow | undefined>;
}

export async function applyRequestOutcome(
  protocol: string,
  categoryId: number | null,
  statusId: number,
  updatedBy: string,
  trx?: Knex.Transaction,
): Promise<void> {
  const source = trx ?? db;

  const updates: Record<string, unknown> = {
    updated_by: updatedBy,
    updated_at: source.fn.now(),
    status_id: statusId,
  };

  if (categoryId !== null) {
    updates.category_id = categoryId;
  }

  await source("requests")
    .where({ protocol })
    .update(updates);
}

export async function saveTriageDecision(
  protocol: string,
  triage: TriageAssessment,
  categoryId: number | null,
  statusId: number,
  updatedBy: string,
): Promise<void> {
  await db.transaction(async (trx) => {
    await upsertTriage(protocol, triage, updatedBy, trx);
    await applyRequestOutcome(protocol, categoryId, statusId, updatedBy, trx);
  });
}

export async function upsertTriage(
  protocol: string,
  triage: TriageAssessment,
  updatedBy: string,
  trx?: Knex.Transaction,
): Promise<void> {
  const source = trx ?? db;

  await source("requests")
    .where({ protocol })
    .update({
      internal_notes: JSON.stringify(triage),
      updated_by: updatedBy,
      updated_at: source.fn.now(),
    });
}

