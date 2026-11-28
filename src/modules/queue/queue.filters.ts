import type { Knex } from "knex";
import { whereUtcDayRange } from "../../shared/datetime/businessDay.ts";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";

export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
  noteCustodianUserId?: number;
}

type MappingAssigneeSelector = {
  readonly field: "user_id" | "professional_id";
  readonly value: number | string;
};

function applyMappingAssigneeMatch(
  query: Knex.QueryBuilder,
  selector: MappingAssigneeSelector,
): void {
  query.orWhere((mappingFilter) => {
    mappingFilter
      .whereExists((currentMapping) =>
        currentMapping
          .select("mapping.mapping_id")
          .from("mappings as mapping")
          .join(
            "details_professional as mapping_assignee",
            "mapping_assignee.professional_id",
            "mapping.professional_id",
          )
          .whereRaw("mapping.request_id = requests.request_id")
          .andWhere("mapping.is_concluded", false)
          .whereRaw(
            `mapping.mapping_id = (
              SELECT latest_mapping.mapping_id
              FROM mappings AS latest_mapping
              WHERE latest_mapping.request_id = requests.request_id
                AND latest_mapping.is_concluded = FALSE
              ORDER BY latest_mapping.created_at DESC, latest_mapping.updated_at DESC
              LIMIT 1
            )`,
          )
          .andWhere(`mapping_assignee.${selector.field}`, selector.value),
      )
      .orWhereExists((initialMappingAssignee) =>
        initialMappingAssignee
          .select("initial_assignee.professional_id")
          .from("details_professional as initial_assignee")
          .whereRaw("initial_assignee.professional_id = requests.mapping_professional_id")
          .andWhere(`initial_assignee.${selector.field}`, selector.value)
          .whereNotExists((mapping) =>
            mapping
              .select("any_mapping.mapping_id")
              .from("mappings as any_mapping")
              .whereRaw("any_mapping.request_id = requests.request_id"),
          ),
      );
  });
}

/**
 * Aplica a mesma semântica de filtros à listagem paginada e à exportação.
 * As queries consumidoras usam os aliases `requests`, `requester`, `status`,
 * `priority_tbl`, `assignee_user` e, quando há escopo, `mapping_assignee`.
 *
 * A busca inclui notas internas, então este helper só pode ser usado por
 * consultas internas (`GET /queue` e exportação CSV com custódia de
 * `queue:export`).
 *
 * Dois limites são distintos: `scopedUserId` é o escopo da fila (triagem ou
 * mapeamento); `noteCustodianUserId` é a custódia de `internal_note:read` e
 * vale somente para a correspondência em notas. O responsável de mapeamento
 * amplia a fila e também a busca por nota: a correspondência soma o Responsável
 * da triagem e o Designado do mapeamento corrente, como as notas. Os filtros de
 * data e departamento (issue #215) entram no mesmo conjunto e, portanto, também
 * valem para a exportação CSV. As datas usam o dia em UTC, conforme o
 * contrato RF04; o dashboard mantém o dia comercial `America/Sao_Paulo`.
 */
export function applyQueueFilters(query: Knex.QueryBuilder, filters: QueueRepositoryFilters): void {
  const {
    search,
    status,
    priority,
    assigneeId,
    unassigned,
    createdFrom,
    createdTo,
    department,
    scopedUserId,
    noteCustodianUserId,
  } = filters;

  if (search) {
    const searchPattern = `%${search}%`;

    query.andWhere((builder) => {
      builder
        .where("requests.protocol", "ilike", searchPattern)
        .orWhere("requests.title", "ilike", searchPattern)
        .orWhere("requests.process_name", "ilike", searchPattern)
        .orWhere("requests.need_description", "ilike", searchPattern)
        .orWhere("requests.problem_opportunity", "ilike", searchPattern)
        .orWhere("requests.expected_result", "ilike", searchPattern)
        .orWhere("requester.corporate_email", "ilike", searchPattern)
        .orWhere("requester.full_name", "ilike", searchPattern)
        .orWhereExists((notesQuery) => {
          notesQuery
            .select(1)
            .from("request_internal_notes as note")
            .whereRaw("note.request_id = requests.request_id")
            .andWhere("note.content", "ilike", searchPattern);

          if (noteCustodianUserId !== undefined) {
            if (noteCustodianUserId > 0) {
              // A custódia de `internal_note:read` soma o Responsável da
              // triagem e o Designado do mapeamento corrente, como as notas.
              notesQuery.andWhere((custody) => {
                custody.where("assignee_user.user_id", noteCustodianUserId);
                applyMappingAssigneeMatch(custody, {
                  field: "user_id",
                  value: noteCustodianUserId,
                });
              });
            } else {
              // Sentinela 0: ator sem `internal_note:read` não casa nota alguma.
              notesQuery.andWhere("assignee_user.user_id", noteCustodianUserId);
            }
          }
        });
    });
  }

  whereUtcDayRange(query, "requests.created_at", { from: createdFrom, to: createdTo });

  if (department) {
    query.whereRaw(`lower("requester"."department") = lower(?)`, [department]);
  }

  if (status) query.andWhere("status.name", status);

  if (priority === "nenhum") {
    query.whereNull("requests.priority_id");
  } else if (priority) {
    query.andWhere("priority_tbl.level", priority);
  }

  if (unassigned || assigneeId === "unassigned") {
    query.whereNull("requests.professional_id");
  } else if (assigneeId) {
    if (/^\d+$/.test(assigneeId)) {
      query.andWhere((builder) => {
        builder.where("assignee_user.user_id", Number(assigneeId));
        applyMappingAssigneeMatch(builder, {
          field: "user_id",
          value: Number(assigneeId),
        });
      });
    } else {
      query.andWhere((builder) => {
        builder.where("requests.professional_id", assigneeId);
        applyMappingAssigneeMatch(builder, {
          field: "professional_id",
          value: assigneeId,
        });
      });
    }
  }

  // A Fila inclui o Responsável da solicitação ou do Mapeamento corrente.
  if (scopedUserId !== undefined) {
    query.andWhere((builder) => {
      builder.where("assignee_user.user_id", scopedUserId);
      applyMappingAssigneeMatch(builder, { field: "user_id", value: scopedUserId });
    });
  }
}
