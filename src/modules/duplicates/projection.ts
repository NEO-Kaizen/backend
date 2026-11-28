import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import type { PublicationStatus, SuppressionReason } from "../../shared/types/duplicates.ts";
import { isCompletedStatus } from "../../shared/types/status.ts";
import {
  warnDuplicateCompletedWindowFallback,
  type DuplicateCompletedWindow,
} from "./completedWindow.ts";
import {
  findExistingProjectionForUpdate,
  findProjectionSource,
  getDuplicateCompletedWindow,
  lockDuplicateSettings,
  type ExistingProjection,
  type ProjectionSourceRow,
} from "./duplicates.repository.ts";
import { buildCompletedProjectionText } from "./redact.ts";
import {
  buildCompletedRequestTemplate,
  buildOpenRequestTemplate,
  COMPLETED_REQUEST_PUBLIC_STATUS,
  type PublicRequestTemplate,
} from "./template.ts";

/**
 * Publicação/supressão da projeção pública de uma Solicitação (issue #209;
 * concluídas na issue #210).
 *
 * A linha é sempre criada ou atualizada — publicada ou suprimida — dentro da
 * transação que alterou a Solicitação. A busca e o parse da linha interna
 * vivem no repository; este módulo decide a supressão, monta o texto público e
 * grava a linha.
 *
 * Regras em `docs/rules/duplicate-detection.md`.
 */
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
  /** Texto ISO UTC com microssegundos, copiado exatamente de `requests`. */
  public_concluded_at: string | null;
  published_at: Date | Knex.Raw | null;
  suppressed_at: Date | Knex.Raw | null;
  suppression_reason: SuppressionReason | null;
}

/** Linha pronta para insert/upsert em `request_public_projections`. */
export interface ProjectionRow extends ProjectionValues {
  request_id: string;
  version: number;
  updated_at: Date | Knex.Raw;
}

/** Sinais de elegibilidade usados pela precedência de supressão. */
export interface SuppressionSignals {
  statusIsActive: boolean;
  statusIsTerminal: boolean;
  statusIsCompleted: boolean;
  handlesRestrictedInfo: boolean | null;
  statusIsRestricted: boolean;
  hasConcludedAt: boolean;
  concludedAtIsWithinWindow: boolean;
  categoryIsPubliclyListable: boolean;
  statusIsCorpusEligible: boolean;
}

function toSuppressionSignals(source: ProjectionSourceRow): SuppressionSignals {
  return {
    statusIsActive: source.status_is_active,
    statusIsTerminal: source.status_is_terminal,
    statusIsCompleted: isCompletedStatus(source.status_id),
    handlesRestrictedInfo: source.handles_restricted_info,
    statusIsRestricted: source.status_is_restricted,
    hasConcludedAt: source.concluded_at !== null,
    concludedAtIsWithinWindow: source.is_within_window,
    categoryIsPubliclyListable: source.category_is_publicly_listable,
    statusIsCorpusEligible: source.status_is_duplicate_corpus_eligible,
  };
}

/**
 * Precedência determinística dos motivos de supressão.
 *
 * O Status 16 é terminal, mas não cai em `terminal_status`: ele entra no
 * corpus de concluídas desde que tenha `concluded_at` e esteja na janela.
 */
export function resolveSuppressionReason(input: SuppressionSignals): SuppressionReason | null {
  if (!input.statusIsActive) return "inactive_status";
  if (input.statusIsTerminal && !input.statusIsCompleted) return "terminal_status";
  if (input.handlesRestrictedInfo === true) return "restricted_request";
  if (input.statusIsRestricted) return "restricted_status";
  if (input.statusIsCompleted) {
    if (!input.hasConcludedAt) return "missing_concluded_at";
    if (!input.concludedAtIsWithinWindow) return "outside_window";
  }
  if (!input.categoryIsPubliclyListable) return "ineligible_category";
  if (!input.statusIsCorpusEligible) return "ineligible_status";
  return null;
}

/**
 * Texto público da projeção. Aberta usa o template sem texto livre. Concluída
 * usa título + descrição/problema com o gate de PII; PII, texto vazio ou
 * qualquer supressão usam o template de concluída — a linha suprimida nunca
 * guarda texto livre.
 */
function buildProjectionText(
  source: ProjectionSourceRow,
  suppressionReason: SuppressionReason | null,
): PublicRequestTemplate {
  const isCompleted = isCompletedStatus(source.status_id);

  if (!isCompleted) {
    return buildOpenRequestTemplate({
      category: source.category_name,
      createdAt: source.created_at,
    });
  }

  const fallback = buildCompletedRequestTemplate({
    category: source.category_name,
    createdAt: source.created_at,
  });

  if (suppressionReason) {
    return fallback;
  }

  const redacted = buildCompletedProjectionText({
    title: source.title,
    description: source.need_description,
    problem: source.problem_opportunity,
    category: source.category_name,
    createdAt: source.created_at,
  });

  return {
    title: redacted.title,
    summary: redacted.summary,
    category: source.category_name,
    status: COMPLETED_REQUEST_PUBLIC_STATUS,
    period: fallback.period,
    redactionVersion: redacted.redactionVersion,
  };
}

/**
 * Monta a linha da projeção a partir da fonte e do estado anterior. Função
 * pura de domínio (a única dependência de banco é o relógio/UUID passados): é
 * reaproveitada pela publicação isolada e pela reavaliação em lote das
 * allowlists (#212), para que as duas não dupliquem a precedência de supressão.
 */
export function buildProjectionRow(
  trx: Knex.Transaction,
  source: ProjectionSourceRow,
  existing: ExistingProjection | undefined,
): ProjectionRow {
  const suppressionReason = resolveSuppressionReason(toSuppressionSignals(source));
  const template = buildProjectionText(source, suppressionReason);
  const isPubliclyListable =
    source.category_is_publicly_listable && source.status_is_duplicate_corpus_eligible;
  const publicationStatus: PublicationStatus = suppressionReason ? "suppressed" : "published";

  // `published_at`/`suppressed_at` usam o relógio do banco, o mesmo de
  // `public_concluded_at` e da varredura. O cursor do poll usa o relógio da
  // aplicação com sobreposição de 5 min (`DUPLICATE_INDEX_OVERLAP_MS`).
  const now = trx.fn.now();
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

  return {
    request_id: source.request_id,
    public_id: existing?.public_id ?? randomUUID(),
    public_title: template.title,
    public_summary: template.summary,
    public_category: template.category,
    public_status: template.status,
    public_period: template.period,
    publication_status: publicationStatus,
    is_publicly_listable: isPubliclyListable,
    redaction_version: template.redactionVersion,
    public_concluded_at: source.concluded_at,
    published_at: publishedAt,
    suppressed_at: suppressedAt,
    suppression_reason: suppressionReason,
    version: (existing?.version ?? 0) + 1,
    updated_at: now,
  };
}

/**
 * Cria ou atualiza a projeção de uma Solicitação. Deve rodar na MESMA
 * transação da criação, edição, transição de Status ou desfecho da Triagem.
 *
 * O lock do singleton serializa com os PATCHes administrativos de flag/janela e
 * allowlists (#212): a decisão lê Categoria/Status depois do lock, evitando
 * *lost update* e Solicitações criadas durante um PATCH.
 *
 * `window` permite que backfill e varredura leiam a configuração uma vez por
 * lote; sem ele, a janela é lida nesta chamada.
 */
export async function publishRequestProjection(
  trx: Knex.Transaction,
  requestId: string,
  window?: DuplicateCompletedWindow,
): Promise<void> {
  await lockDuplicateSettings(trx);

  const resolvedWindow =
    window ??
    (await getDuplicateCompletedWindow({ trx, onFallback: warnDuplicateCompletedWindowFallback }));
  const source = await findProjectionSource(trx, requestId, resolvedWindow);

  // Solicitação removida fisicamente: não há o que projetar.
  if (!source) return;

  const existing = await findExistingProjectionForUpdate(trx, requestId);
  const row = buildProjectionRow(trx, source, existing);

  if (!existing) {
    // `created_at` usa o relógio do banco (default da migration).
    await trx("request_public_projections").insert(row);
    return;
  }

  await trx("request_public_projections").where({ request_id: requestId }).update(row);
}
