import db from "../../database/conection.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { STATUS_IDS } from "../../shared/types/status.ts";
import type { AuthenticatedUser } from "../../shared/types/user.ts";
import {
  lockRequestByDirectOwner,
  clearReopenedRequestProjections,
} from "./requests.repository.ts";
import { applyStatusTransition } from "./statusTransition.ts";
import { reopenJustificationSchema } from "./requests.schema.ts";

const REOPEN_TARGET = {
  status_id: STATUS_IDS.requestSent,
  name: "Solicitação enviada",
  isPublic: true,
} as const;
const REOPEN_PUBLIC_MESSAGE = "Solicitação reaberta pelo titular.";

interface ReopenRequestInput {
  actor: Pick<AuthenticatedUser, "id" | "email" | "role">;
  protocol: string;
  justification: string;
  closureRef: string;
  ipAddress?: string;
}

interface ReopenRequestResult {
  protocol: string;
  statusId: typeof REOPEN_TARGET.status_id;
  status: typeof REOPEN_TARGET.name;
}

export function isReopenableStatus(statusId: number): boolean {
  return statusId === STATUS_IDS.completed || statusId === STATUS_IDS.canceled;
}

export async function reopenRequest(input: ReopenRequestInput): Promise<ReopenRequestResult> {
  if (input.actor.role !== "Solicitante") {
    throw new AppError("Ação restrita a solicitantes.", 403);
  }

  const protocol = input.protocol.trim();
  if (protocol === "") {
    throw new AppError("Protocolo obrigatório.", 400);
  }

  const justification = reopenJustificationSchema.safeParse(input.justification);
  if (!justification.success) {
    throw new ValidationError(
      { justification: justification.error.issues[0]?.message ?? "Justificativa inválida." },
      "Validação falhou",
    );
  }

  const requesterUserId = Number(input.actor.id);
  return db.transaction(async (trx) => {
    const request = await lockRequestByDirectOwner(trx, protocol, requesterUserId);
    if (!request) {
      throw new AppError("Protocolo não encontrado.", 404);
    }

    const previousStatusId = request.status_id;
    if (
      !isReopenableStatus(previousStatusId) ||
      request.closure_ref === null ||
      request.closure_ref !== input.closureRef.toLowerCase()
    ) {
      throw new AppError(
        "Encerramento inelegível ou confirmação obsoleta.",
        409,
        "rf02_closure_conflict",
      );
    }

    await applyStatusTransition(trx, {
      requestId: request.request_id,
      target: REOPEN_TARGET,
      updatedBy: input.actor.email,
      expectedStatusId: previousStatusId,
      lastTechnicalMessage: REOPEN_PUBLIC_MESSAGE,
    });
    const previousMeeting = await clearReopenedRequestProjections(trx, request);

    await recordAudit(trx, {
      entityType: "request",
      entityId: protocol,
      actionType: "request.reopen",
      userId: requesterUserId,
      previousValue: previousStatusId === STATUS_IDS.completed ? "Concluído" : "Cancelado",
      newValue: REOPEN_TARGET.name,
      note: justification.data,
      lastTechnicalMessage: REOPEN_PUBLIC_MESSAGE,
      changeOrigin: "requester",
      ipAddress: input.ipAddress,
      previousMeeting,
    });

    return { protocol, statusId: REOPEN_TARGET.status_id, status: REOPEN_TARGET.name };
  });
}
