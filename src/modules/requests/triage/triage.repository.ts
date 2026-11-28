import type { Knex } from "knex";
import { AppError } from "../../../shared/errors/AppError.ts";
import { CURRENT_MAPPING_ASSIGNEE_JOIN } from "../../../shared/access/currentMapping.ts";
import db from "../../../database/conection.ts";
import type { TriageAssessment } from "./triage.schema.ts";

export interface StatusRow {
  status_id: number;
  name: string;
  isPublic: boolean;
  isRestricted: boolean;
}

interface CategoryRow {
  category_id: number;
  name: string;
}

export interface RequestContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  assignee_user_id: number | null;
  mapping_assignee_user_id: number | null;
  status_id: number;
  reopen_ref: string | null;
  status_name: string | null;
  status_is_restricted: boolean;
  status_is_terminal: boolean;
  category_name: string | null;
  requester_user_id: number | null;
  title: string;
}

export async function findRequestContext(protocol: string): Promise<RequestContextRow | undefined> {
  return db("requests")
    .leftJoin("details_professional as dp", "dp.professional_id", "requests.professional_id")
    .leftJoin("statuses as s", "s.status_id", "requests.status_id")
    .leftJoin("categories as c", "c.category_id", "requests.category_id")
    .joinRaw(CURRENT_MAPPING_ASSIGNEE_JOIN)
    .where("requests.protocol", protocol)
    .first({
      request_id: "requests.request_id",
      protocol: "requests.protocol",
      professional_id: "requests.professional_id",
      assignee_user_id: "dp.user_id",
      mapping_assignee_user_id: "mapping_user.user_id",
      status_id: "requests.status_id",
      reopen_ref: "requests.reopen_ref",
      status_name: "s.name",
      status_is_restricted: "s.is_restricted",
      status_is_terminal: "s.is_terminal",
      category_name: "c.name",
      requester_user_id: "requests.requester_user_id",
      title: "requests.title",
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
  assignee_user_id: number | null;
  assignee_name: string | null;
  assignee_email: string | null;
  last_technical_message: string | null;
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
  "t.assignee_user_id",
  "t.assignee_name",
  "t.assignee_email",
  "t.last_technical_message",
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
    assignee:
      row.assignee_user_id === null && row.assignee_name === null
        ? null
        : {
            id: row.assignee_user_id === null ? null : String(row.assignee_user_id),
            name: row.assignee_name,
            email: row.assignee_email,
          },
    lastTechnicalMessage: row.last_technical_message,
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
 * Resolve a saída da triagem contra `statuses`. Motor de Status v4 (delta
 * §3.1): elegível = `isActive && isRestricted===false && triageMode` em
 * `free`/`conclusion_only` — substitui o antigo filtro `isTriageExit`.
 * Contrato puro: só id numérico — literais antigos (nomes) são rejeitados
 * com 422 (`contract-triage_04.md` §Observações).
 *
 * O filtro `is_restricted=false` garante que a saída da triagem nunca seja
 * restrita; o valor é projetado e repassado ao emissor de Notificação, sem
 * depender de um literal no call site.
 */
export async function resolveExitStatus(value: number): Promise<StatusRow | undefined> {
  if (!Number.isSafeInteger(value) || value <= 0) return undefined;
  return db("statuses")
    .where({ is_active: true, is_restricted: false })
    .where({ triage_mode: "conclusion_only" })
    .where({ status_id: value })
    .first("status_id as status_id", "name", "is_public", "is_restricted")
    .then(
      (
        row:
          | { status_id: number; name: string; is_public: boolean; is_restricted: boolean }
          | undefined,
      ) =>
        row
          ? {
              status_id: row.status_id,
              name: row.name,
              isPublic: row.is_public,
              isRestricted: row.is_restricted,
            }
          : undefined,
    );
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

export interface ApplyRequestOutcomeInput {
  protocol: string;
  categoryId: number | null;
  statusId: number;
  isStatusPublic: boolean;
  lastTechnicalMessage: string | null;
  expectedStatusId: number;
  updatedBy: string;
  trx?: Knex.Transaction;
}

export async function applyRequestOutcome(input: ApplyRequestOutcomeInput): Promise<void> {
  const {
    protocol,
    categoryId,
    statusId,
    isStatusPublic,
    lastTechnicalMessage,
    expectedStatusId,
    updatedBy,
    trx,
  } = input;
  const source = trx ?? db;

  const updates: Record<string, unknown> = {
    updated_by: updatedBy,
    updated_at: source.fn.now(),
    status_id: statusId,
  };

  // Conclusão da triagem encerra a custódia do responsável (issue de
  // release automático): a solicitação volta a ficar sem responsável de
  // triagem e depende de nova atribuição. O snapshot do autor permanece em
  // `triages.assignee_*`.
  updates.professional_id = null;

  if (isStatusPublic) {
    if (!lastTechnicalMessage) {
      throw new Error("Retorno ao solicitante obrigatório para status público.");
    }
    updates.last_public_status_id = statusId;
    updates.last_technical_message = lastTechnicalMessage;
    updates.last_external_update_at = source.fn.now();
  }

  if (categoryId !== null) {
    updates.category_id = categoryId;
  }

  const updatedRows = await source("requests")
    .where({ protocol })
    .andWhere("status_id", expectedStatusId)
    .update(updates);

  if (updatedRows === 0) {
    throw new AppError("Solicitação foi atualizada por outra operação.", 409);
  }
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
    assignee_user_id:
      triage.assignee?.id === null || triage.assignee?.id === undefined
        ? null
        : Number(triage.assignee.id),
    assignee_name: triage.assignee?.name ?? null,
    assignee_email: triage.assignee?.email ?? null,
    last_technical_message: triage.lastTechnicalMessage,
  });
}
