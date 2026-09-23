import type { Knex } from "knex";
import db from "../../../database/conection.ts";
import { recordAudit } from "../../../shared/audit/auditLogger.ts";
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
  status_name: string | null;
  category_name: string | null;
}

export async function findRequestContext(protocol: string): Promise<RequestContextRow | undefined> {
  return db("requests as r")
    .leftJoin("details_professional as dp", "dp.professional_id", "r.professional_id")
    .leftJoin("statuses as s", "s.status_id", "r.status_id")
    .leftJoin("categories as c", "c.category_id", "r.category_id")
    .where("r.protocol", protocol)
    .first({
      request_id: "r.request_id",
      protocol: "r.protocol",
      professional_id: "r.professional_id",
      assignee_user_id: "dp.user_id",
      status_name: "s.name",
      category_name: "c.name",
    });
}

/** Linha de `triages` — snapshot normalizado do assessment (fonte de verdade). */
interface TriageRow {
  triage_id: string;
  adherent_to_scope: "Sim" | "Não" | "";
  adherent_justification: string;
  change_category: "Sim" | "Não" | "";
  new_category: string;
  preliminary_complexity: string;
  perceived_risks: string;
  suggested_responsible: string;
  suggested_responsible_justification: string;
  exit_status: number;
  result: string;
  conclusion_justification: string;
}

const TRIAGE_COLUMNS = [
  "t.triage_id",
  "t.adherent_to_scope",
  "t.adherent_justification",
  "t.change_category",
  "t.new_category",
  "t.preliminary_complexity",
  "t.perceived_risks",
  "t.suggested_responsible",
  "t.suggested_responsible_justification",
  "t.exit_status",
  "t.result",
  "t.conclusion_justification",
] as const;

function rowToAssessment(row: TriageRow): TriageAssessment {
  return {
    id: row.triage_id,
    adherentToScope: row.adherent_to_scope,
    adherentJustification: row.adherent_justification,
    changeCategory: row.change_category,
    newCategory: row.new_category,
    preliminaryComplexity: row.preliminary_complexity,
    perceivedRisks: row.perceived_risks,
    suggestedResponsible: row.suggested_responsible,
    suggestedResponsibleJustification: row.suggested_responsible_justification,
    exitStatus: row.exit_status,
    result: row.result,
    conclusionJustification: row.conclusion_justification,
  };
}

/**
 * Última triagem da solicitação (fonte: `triages`).
 *
 * O uuid de `triage_id` NÃO é monotônico (contrato: uuid v4 gerado no POST),
 * então a ordem vem da linha `request.triage` do `audit_history` que a gerou
 * (`new_value->>'triageId'`), desempatada por `audit_id` — nunca pelo id.
 */
export async function findLatestTriage(protocol: string): Promise<TriageAssessment | null> {
  const row = await db("audit_history as audit")
    .joinRaw("JOIN triages AS t ON t.triage_id = (audit.new_value::json->>'triageId')::uuid")
    .join("requests as r", "r.request_id", "t.request_id")
    .where({
      "audit.entity_type": "request",
      "audit.action_type": "request.triage",
      "r.protocol": protocol,
    })
    .orderBy("audit.occurred_at", "desc")
    .orderBy("audit.audit_id", "desc")
    .first(...TRIAGE_COLUMNS);

  return row ? rowToAssessment(row as TriageRow) : null;
}

/**
 * Resolve a saída da triagem contra `statuses` (ativos + `is_triage_exit`).
 * Contrato puro: só id numérico — literais antigos (nomes) são rejeitados
 * com 422 (`contract-triage_04.md` §Observações).
 */
export async function resolveExitStatus(value: number): Promise<StatusRow | undefined> {
  if (!Number.isSafeInteger(value) || value <= 0) return undefined;
  return db("statuses")
    .where({ is_active: true, is_triage_exit: true, status_id: value })
    .first("status_id as status_id", "name") as Promise<StatusRow | undefined>;
}

/**
 * Resolve a categoria de destino contra o cadastro **ativo**
 * (`contract-triage_04.md` §1 — `newCategory` deve estar ativo). Contrato:
 * name-string (nunca id).
 */
export async function resolveCategoryId(value: string): Promise<CategoryRow | undefined> {
  const raw = value.trim();
  if (!raw) return undefined;

  return db("categories")
    .where({ status: "active", name: raw })
    .first("category_id as category_id", "name") as Promise<CategoryRow | undefined>;
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

  await source("requests").where({ protocol }).update(updates);
}

export interface TriageAuditContext {
  actorId: number;
  previousStatus: string | null;
  previousCategory: string | null;
  nextStatus: string;
}

/**
 * Append do snapshot em `triages` (D-N14): um id só — `triage_id =
 * TriageAssessment.id` (uuid gerado no service). A proveniência
 * (`occurredAt`/`actor`/`changeOrigin`) NÃO mora nesta tabela; vem do
 * `audit_history` `request.triage` correlacionado por `new_value->>'triageId'`.
 */
export async function insertTriage(
  requestId: string,
  triage: TriageAssessment,
  trx: Knex.Transaction,
): Promise<void> {
  await trx("triages").insert({
    triage_id: triage.id,
    request_id: requestId,
    adherent_to_scope: triage.adherentToScope,
    adherent_justification: triage.adherentJustification,
    change_category: triage.changeCategory,
    new_category: triage.newCategory,
    preliminary_complexity: triage.preliminaryComplexity,
    perceived_risks: triage.perceivedRisks,
    suggested_responsible: triage.suggestedResponsible,
    suggested_responsible_justification: triage.suggestedResponsibleJustification,
    exit_status: triage.exitStatus,
    result: triage.result,
    conclusion_justification: triage.conclusionJustification,
  });
}

export async function saveTriageDecision(
  protocol: string,
  requestId: string,
  triage: TriageAssessment,
  categoryId: number | null,
  statusId: number,
  updatedBy: string,
  audit: TriageAuditContext,
): Promise<void> {
  await db.transaction(async (trx) => {
    await insertTriage(requestId, triage, trx);
    await applyRequestOutcome(protocol, categoryId, statusId, updatedBy, trx);
    await recordAudit(trx, {
      entityType: "request",
      entityId: protocol,
      actionType: "request.triage",
      userId: audit.actorId,
      previousValue: JSON.stringify({
        status: audit.previousStatus,
        category: audit.previousCategory,
      }),
      newValue: JSON.stringify({
        triageId: triage.id,
        exitStatus: triage.exitStatus,
        status: audit.nextStatus,
      }),
      changeOrigin: "admin",
    });
  });
}
