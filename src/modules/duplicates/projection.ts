import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import type { PublicationStatus, SuppressionReason } from "../../shared/types/duplicates.ts";
import { buildOpenRequestTemplate } from "./template.ts";

/**
 * Publicação/supressão da projeção pública de uma Solicitação (issue #209).
 *
 * A linha é sempre criada ou atualizada — publicada ou suprimida — dentro da
 * transação que alterou a Solicitação. A busca nunca lê `requests`; este
 * módulo é o único que monta o snapshot público a partir da base interna.
 *
 * Regras em `docs/rules/duplicate-detection.md`.
 */
interface ProjectionSourceRow {
  request_id: string;
  created_at: Date;
  handles_restricted_info: boolean | null;
  category_name: string;
  category_is_publicly_listable: boolean;
  status_name: string;
  status_is_active: boolean;
  status_is_terminal: boolean;
  status_is_restricted: boolean;
  status_is_duplicate_corpus_eligible: boolean;
}

interface ExistingProjection {
  public_id: string;
  publication_status: PublicationStatus;
  published_at: Date | null;
  suppressed_at: Date | null;
}

interface ProjectionValues {
  public_id: string;
  public_title: string;
  public_summary: string;
  public_category: string;
  public_status: string;
  public_period: string;
  publication_status: PublicationStatus;
  is_publicly_listable: boolean;
  redaction_version: string;
  published_at: Date | null;
  suppressed_at: Date | null;
  suppression_reason: SuppressionReason | null;
}

/** Sinais de elegibilidade usados pela precedência de supressão. */
export interface SuppressionSignals {
  statusIsActive: boolean;
  statusIsTerminal: boolean;
  handlesRestrictedInfo: boolean | null;
  statusIsRestricted: boolean;
  categoryIsPubliclyListable: boolean;
  statusIsCorpusEligible: boolean;
}

function toSuppressionSignals(source: ProjectionSourceRow): SuppressionSignals {
  return {
    statusIsActive: source.status_is_active,
    statusIsTerminal: source.status_is_terminal,
    handlesRestrictedInfo: source.handles_restricted_info,
    statusIsRestricted: source.status_is_restricted,
    categoryIsPubliclyListable: source.category_is_publicly_listable,
    statusIsCorpusEligible: source.status_is_duplicate_corpus_eligible,
  };
}

/** Precedência determinística dos motivos de supressão. */
export function resolveSuppressionReason(input: SuppressionSignals): SuppressionReason | null {
  if (!input.statusIsActive) return "inactive_status";
  if (input.statusIsTerminal) return "terminal_status";
  if (input.handlesRestrictedInfo === true) return "restricted_request";
  if (input.statusIsRestricted) return "restricted_status";
  if (!input.categoryIsPubliclyListable) return "ineligible_category";
  if (!input.statusIsCorpusEligible) return "ineligible_status";
  return null;
}

async function findProjectionSource(
  trx: Knex.Transaction,
  requestId: string,
): Promise<ProjectionSourceRow | undefined> {
  return trx("requests as r")
    .join("categories as c", "c.category_id", "r.category_id")
    .join("statuses as s", "s.status_id", "r.status_id")
    .where("r.request_id", requestId)
    .first({
      request_id: "r.request_id",
      created_at: "r.created_at",
      handles_restricted_info: "r.handles_restricted_info",
      category_name: "c.name",
      category_is_publicly_listable: "c.is_publicly_listable",
      status_name: "s.name",
      status_is_active: "s.is_active",
      status_is_terminal: "s.is_terminal",
      status_is_restricted: "s.is_restricted",
      status_is_duplicate_corpus_eligible: "s.is_duplicate_corpus_eligible",
    });
}

/**
 * Cria ou atualiza a projeção de uma Solicitação. Deve rodar na MESMA
 * transação da criação, edição, transição de Status ou desfecho da Triagem.
 */
export async function publishRequestProjection(
  trx: Knex.Transaction,
  requestId: string,
): Promise<void> {
  const source = await findProjectionSource(trx, requestId);

  // Solicitação removida fisicamente: não há o que projetar.
  if (!source) return;

  const template = buildOpenRequestTemplate({
    category: source.category_name,
    createdAt: source.created_at,
  });

  const isPubliclyListable =
    source.category_is_publicly_listable && source.status_is_duplicate_corpus_eligible;

  const suppressionReason = resolveSuppressionReason(toSuppressionSignals(source));

  const publicationStatus: PublicationStatus = suppressionReason ? "suppressed" : "published";
  const existing = (await trx("request_public_projections")
    .where({ request_id: requestId })
    .forUpdate()
    .first("public_id", "publication_status", "published_at", "suppressed_at")) as
    ExistingProjection | undefined;

  const now = new Date();
  const publishedAt =
    publicationStatus === "published"
      ? (existing?.published_at ?? now)
      : (existing?.published_at ?? null);
  const suppressedAt =
    publicationStatus === "suppressed"
      ? existing?.publication_status === "suppressed"
        ? (existing.suppressed_at ?? now)
        : now
      : null;

  const values: ProjectionValues = {
    public_id: existing?.public_id ?? randomUUID(),
    public_title: template.title,
    public_summary: template.summary,
    public_category: template.category,
    public_status: template.status,
    public_period: template.period,
    publication_status: publicationStatus,
    is_publicly_listable: isPubliclyListable,
    redaction_version: template.redactionVersion,
    published_at: publishedAt,
    suppressed_at: suppressedAt,
    suppression_reason: suppressionReason,
  };

  if (!existing) {
    // `created_at` e `updated_at` usam o relógio do banco (default da migration),
    // que é o mesmo relógio lido pelo cursor do poll.
    await trx("request_public_projections").insert({
      request_id: requestId,
      ...values,
      version: 1,
    });
    return;
  }

  await trx("request_public_projections")
    .where({ request_id: requestId })
    .update({
      ...values,
      version: trx.raw("version + 1"),
      updated_at: trx.fn.now(),
    });
}
