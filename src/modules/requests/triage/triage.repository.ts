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

const TRIAGE_WRAPPER_KEY = "__triage";

/**
 * Extrai o assessment da triagem do `requests.internal_notes`.
 *
 * A triagem convive com as observações internas (contrato do módulo
 * internalNotes) sob a chave reservada `__triage`, preservando o texto puro
 * de `internalObservations` (ver `requests.service.ts`). Valores legados —
 * gravados como JSON puro antes do wrapper — continuam sendo lidos.
 */
function parseTriageFromInternalNotes(raw: string | null | undefined): TriageAssessment | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const wrapper = parsed as Record<string, unknown>;
  if (TRIAGE_WRAPPER_KEY in wrapper) {
    return isTriageAssessment(wrapper[TRIAGE_WRAPPER_KEY])
      ? (wrapper[TRIAGE_WRAPPER_KEY] as TriageAssessment)
      : null;
  }

  return isTriageAssessment(parsed) ? parsed : null;
}

export async function findTriageByProtocol(protocol: string): Promise<TriageAssessment | null> {
  const row = await db("requests")
    .where({ protocol })
    .first("internal_notes");

  return parseTriageFromInternalNotes(row?.internal_notes);
}

/** Guarda anti-NaN: converte o raw apenas quando é um id numérico válido
 * (dígitos puros, sem sinais/hexadecimal/notação científica). */
function toNumericId(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const numericId = Number(raw);
  return Number.isSafeInteger(numericId) ? numericId : null;
}

export async function resolveExitStatus(value: string): Promise<StatusRow | undefined> {
  const raw = value.trim();
  if (!raw) return undefined;

  const numericId = toNumericId(raw);

  const query = db("statuses")
    .where({ is_active: true, is_triage_exit: true })
    .where((builder) => {
      builder.where("name", raw);
      if (numericId !== null) builder.orWhere("status_id", numericId);
    })
    .first("status_id as status_id", "name");

  return query as Promise<StatusRow | undefined>;
}

export async function resolveCategoryId(value: string): Promise<CategoryRow | undefined> {
  const raw = value.trim();
  if (!raw) return undefined;

  const numericId = toNumericId(raw);

  const query = db("categories")
    .where((builder) => {
      builder.where("name", raw);
      if (numericId !== null) builder.orWhere("category_id", numericId);
    })
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

  const row = await source("requests")
    .where({ protocol })
    .first("internal_notes");

  let merged: Record<string, unknown> = {};
  const rawNotes = row?.internal_notes;
  if (rawNotes) {
    try {
      const parsed: unknown = JSON.parse(String(rawNotes));
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        merged = { ...(parsed as Record<string, unknown>) };
      } else {
        // Observações legadas em texto puro (não-JSON): preservadas sob a
        // chave `observations` para não serem perdidas ao gravar a triagem.
        merged = { observations: String(rawNotes) };
      }
    } catch {
      merged = { observations: String(rawNotes) };
    }
  }
  merged[TRIAGE_WRAPPER_KEY] = triage;

  await source("requests")
    .where({ protocol })
    .update({
      internal_notes: JSON.stringify(merged),
      updated_by: updatedBy,
      updated_at: source.fn.now(),
    });
}

