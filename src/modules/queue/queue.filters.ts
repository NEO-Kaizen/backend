import type { Knex } from "knex";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";

export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
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
 * `priority_tbl` e `assignee_user`.
 */
export function applyQueueFilters(query: Knex.QueryBuilder, filters: QueueRepositoryFilters): void {
  const { search, status, priority, assigneeId, unassigned, scopedUserId } = filters;

  if (search) {
    query.andWhere((builder) => {
      builder
        .where("requests.protocol", "ilike", `%${search}%`)
        .orWhere("requester.corporate_email", "ilike", `%${search}%`)
        .orWhere("requester.full_name", "ilike", `%${search}%`);
    });
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
