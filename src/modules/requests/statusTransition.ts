import { AppError } from "../../shared/errors/AppError.ts";
import type { Knex } from "knex";

export interface StatusTransitionTarget {
  status_id: number;
  name: string;
  isPublic: boolean;
}

export interface StatusTransitionInput {
  requestId: string;
  target: StatusTransitionTarget;
  updatedBy: string;
  lastTechnicalMessage?: string | null;
  expectedStatusId?: number | null;
}

export async function applyStatusTransition(
  trx: Knex.Transaction,
  input: StatusTransitionInput,
): Promise<string> {
  const updates: Record<string, unknown> = {
    status_id: input.target.status_id,
    updated_by: input.updatedBy,
    updated_at: trx.fn.now(),
  };

  if (input.target.isPublic) {
    const lastTechnicalMessage = input.lastTechnicalMessage?.trim();
    if (!lastTechnicalMessage) {
      throw new AppError("Informe o retorno ao solicitante para um status público.", 422);
    }
    updates.last_public_status_id = input.target.status_id;
    updates.last_technical_message = lastTechnicalMessage;
    updates.last_external_update_at = trx.fn.now();
  }

  let query = trx("requests").where({ request_id: input.requestId });
  if (input.expectedStatusId !== undefined) {
    query = query.andWhere("status_id", input.expectedStatusId);
  }
  const rows = await query.update(updates).returning("updated_at");
  const row = rows[0] as { updated_at: Date | string } | undefined;
  if (!row) {
    throw new AppError(
      input.expectedStatusId === undefined
        ? "Solicitação não encontrada"
        : "Solicitação foi atualizada por outra operação",
      input.expectedStatusId === undefined ? 404 : 409,
    );
  }
  return new Date(row.updated_at).toISOString();
}
