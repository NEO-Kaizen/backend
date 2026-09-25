// Regras de negócio do subfluxo de Mapeamento (issue #86).
//
// MODELO: o designado para EXECUTAR o mapeamento é um vínculo próprio e
// distinto do responsável pela solicitação (ambos são profissionais; podem
// ser a mesma pessoa, mas são atribuições independentes).
//
// Fluxo do `PUT` (tudo na MESMA transação — fecha janela TOCTOU):
// 1. re-lê contexto da solicitação (status + responsável);
// 2. localiza o alvo (`id` explícito ou mapeamento aberto mais recente);
// 3. aplica a designação (`mappingAssigneeId`) se fornecida;
// 4. autoriza: edição de campos = designado do mapeamento ou Admin;
//    designação = responsável da solicitação ou Admin;
// 5. mescla os campos (ausente mantém / `null` limpa);
// 6. resolve participantes, persiste, audita e (se concluir) avança o status
//    para `Mapeamento agendado`.
import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { ValidationError } from "../../shared/errors/ValidationError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import { ASSIGNABLE_PROFILES } from "../requests/requests.repository.ts";
import { applyStatusTransition } from "../requests/statusTransition.ts";
import type {
  MappingActor,
  MappingAssignee,
  MappingParticipantInput,
  MappingResponseDTO,
  MappingValues,
  ResolvedParticipant,
} from "../DTOs/queue/mapping.dto.ts";
import type { MappingPayload } from "./mapping.schemas.ts";
import * as repository from "./mapping.repository.ts";
import type { MappingRow } from "./mapping.repository.ts";
import type { Knex } from "knex";

/** Audita tentativa negada no PUT de mapeamento (trilha forense completa). */
async function recordMappingAccessDenied(
  protocol: string,
  actorId: number,
  detail: string,
  ipAddress?: string,
): Promise<void> {
  await db.transaction(async (trx) => {
    await recordAudit(trx, {
      entityType: "request",
      actionType: "request.access_denied",
      entityId: protocol,
      userId: actorId,
      previousValue: null,
      newValue: null,
      note: `Mapping negado: ${detail}`,
      ipAddress,
      changeOrigin: "system",
    });
  });
}

/** Serializa instante para ISO-8601 UTC com sufixo `Z` e precisão de segundos. */
function toIsoSeconds(value: Date | string | null): string | null {
  if (value === null) return null;

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace(/\.\d+Z$/, "Z");
}

function emptyValues(): MappingValues {
  return {
    scheduledFor: null,
    durationMinutes: null,
    modality: null,
    meetingLink: null,
    location: null,
    notes: null,
  };
}

function rowToValues(mapping: MappingRow): MappingValues {
  return {
    scheduledFor: toIsoSeconds(mapping.scheduled_for),
    durationMinutes: mapping.duration_minutes,
    modality: mapping.modality,
    meetingLink: mapping.meeting_link,
    location: mapping.location,
    notes: mapping.notes,
  };
}

/** `users.user_id` serializado como `id`; participante externo → `null`. */
function participantId(userId: number | null): string | null {
  return userId !== null ? String(userId) : null;
}

/** Designado serializado para a resposta (`userId` para a comparação do contrato §9). */
function toMappingAssignee(
  candidate: repository.MappingAssigneeCandidate | null,
): MappingAssignee | null {
  if (candidate === null) {
    return null;
  }

  return {
    id: candidate.id,
    userId: String(candidate.userId),
    name: candidate.name,
    email: candidate.email,
    jobTitle: candidate.jobTitle,
  };
}

function toMappingResponse(
  protocol: string,
  mapping: MappingRow,
  participants: repository.MappingParticipantRow[],
  mappingAssignee: MappingAssignee | null,
): MappingResponseDTO {
  return {
    protocol,
    id: mapping.mapping_id,
    targetStatus: mapping.target_status_id,
    scheduledFor: toIsoSeconds(mapping.scheduled_for),
    durationMinutes: mapping.duration_minutes,
    modality: mapping.modality,
    meetingLink: mapping.meeting_link,
    location: mapping.location,
    participants: participants.map((participant) => ({
      id: participantId(participant.userId),
      name: participant.name,
      email: participant.email,
    })),
    notes: mapping.notes,
    mappingAssignee,
  };
}

/**
 * Resposta do `PUT` montada a partir dos valores em memória (já persistidos na
 * transação) — evita reload e asserção não-nula. `scheduledFor` é normalizado
 * para UTC `Z` (idempotente para valores vindos do banco).
 */
function mappingResponseFromValues(
  protocol: string,
  mappingId: string,
  targetStatus: number | null,
  values: MappingValues,
  participants: repository.MappingParticipantRow[],
  mappingAssignee: MappingAssignee | null,
): MappingResponseDTO {
  return {
    protocol,
    id: mappingId,
    targetStatus,
    scheduledFor: toIsoSeconds(values.scheduledFor),
    durationMinutes: values.durationMinutes,
    modality: values.modality,
    meetingLink: values.meetingLink,
    location: values.location,
    participants: participants.map((participant) => ({
      id: participantId(participant.userId),
      name: participant.name,
      email: participant.email,
    })),
    notes: values.notes,
    mappingAssignee,
  };
}

function emptyMappingResponse(protocol: string): MappingResponseDTO {
  return {
    protocol,
    id: null,
    targetStatus: null,
    scheduledFor: null,
    durationMinutes: null,
    modality: null,
    meetingLink: null,
    location: null,
    participants: [],
    notes: null,
    mappingAssignee: null,
  };
}

/**
 * Merge PATCH-like. `undefined` = campo ausente (mantém o atual); `null` ou
 * string vazia = limpa; valor presente = sobrescreve.
 */
function mergeValues(current: MappingValues, payload: MappingPayload): MappingValues {
  const textField = (key: "meetingLink" | "location" | "notes"): string | null => {
    const next = payload[key];
    const normalized =
      next === undefined ? undefined : next === null || next.trim() === "" ? null : next.trim();

    return normalized === undefined ? current[key] : normalized;
  };

  return {
    scheduledFor: payload.scheduledFor === undefined ? current.scheduledFor : payload.scheduledFor,
    durationMinutes:
      payload.durationMinutes === undefined ? current.durationMinutes : payload.durationMinutes,
    modality: payload.modality === undefined ? current.modality : payload.modality,
    meetingLink: textField("meetingLink"),
    location: textField("location"),
    notes: textField("notes"),
  };
}

/** Modalidade × local/link — vale tanto no rascunho quanto na conclusão. */
function validateModality(values: MappingValues): void {
  if (values.modality === "REMOTE" && !values.meetingLink) {
    throw new AppError("Modalidade remota exige o link da reunião (meetingLink).", 422);
  }
  if (values.modality === "IN_PERSON" && !values.location) {
    throw new AppError("Modalidade presencial exige o local da reunião (location).", 422);
  }
}

/** Primeiro campo ausente para concluir o mapeamento — `null` se completo. */
function missingFieldForCompletion(values: MappingValues): string | null {
  if (values.modality === null) return "modality";
  if (values.scheduledFor === null) return "scheduledFor";
  if (values.durationMinutes === null) return "durationMinutes";
  if (values.modality === "REMOTE" && !values.meetingLink) return "meetingLink";
  if (values.modality === "IN_PERSON" && !values.location) return "location";
  return null;
}

/**
 * Resolve participantes: com `id`, nome/e-mail vêm do cadastro (divergência
 * do payload ignorada); sem `id`, persiste o participante externo como
 * enviado. Unicidade verificada novamente após a resolução (cobre id + e-mail
 * do mesmo usuário, que o zod não enxerga).
 */
async function resolveParticipants(
  queryable: Knex,
  participants: MappingParticipantInput[],
): Promise<ResolvedParticipant[]> {
  const userIds = participants.flatMap((participant) =>
    participant.id === undefined ? [] : [Number(participant.id)],
  );

  const usersById = await repository.resolveParticipantUsers(queryable, userIds);

  const resolved = participants.map((participant): ResolvedParticipant => {
    if (participant.id === undefined) {
      return { userId: null, name: participant.name, email: participant.email.toLowerCase() };
    }

    const user = usersById.get(Number(participant.id));
    if (!user) {
      throw new AppError("Participante inválido: usuário inexistente ou inativo.", 422);
    }
    return { userId: user.user_id, name: user.full_name, email: user.email };
  });

  const seenEmails = new Set<string>();
  const seenUserIds = new Set<number>();
  for (const participant of resolved) {
    const emailKey = participant.email.trim().toLowerCase();
    if (seenEmails.has(emailKey)) {
      throw new AppError("Participantes duplicados não são permitidos.", 422);
    }
    seenEmails.add(emailKey);

    if (participant.userId !== null) {
      if (seenUserIds.has(participant.userId)) {
        throw new AppError("Participantes duplicados não são permitidos.", 422);
      }
      seenUserIds.add(participant.userId);
    }
  }

  return resolved;
}

/** Valida elegibilidade do candidato a designado (mesmo critério do módulo `requests`). */
function assertCandidateEligible(candidate: repository.MappingAssigneeCandidate): void {
  if (candidate.professional_status !== "active" || !candidate.user_is_active) {
    throw new AppError("Designado inativo.", 422);
  }
  if (!(ASSIGNABLE_PROFILES as readonly string[]).includes(candidate.profile_name)) {
    throw new AppError("Perfil do designado não permite executar o mapeamento.", 422);
  }
}

export const getMappingService = async (protocol: string): Promise<MappingResponseDTO> => {
  const context = await repository.findMappingRequestContext(db, protocol.trim());
  if (!context) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const mapping = await repository.findCurrentMapping(db, context.request_id);
  if (!mapping) {
    return emptyMappingResponse(context.protocol);
  }

  const [participants, assigneeCandidate] = await Promise.all([
    repository.findMappingParticipants(db, mapping.mapping_id),
    repository.findMappingAssigneeCandidate(db, mapping.professional_id),
  ]);

  return toMappingResponse(
    context.protocol,
    mapping,
    participants,
    toMappingAssignee(assigneeCandidate),
  );
};

export const upsertMappingService = async (
  protocol: string,
  payload: MappingPayload,
  actor: MappingActor,
  ipAddress?: string,
): Promise<MappingResponseDTO> => {
  return db.transaction<MappingResponseDTO>(async (trx) => {
    // Contexto lido DENTRO da transação: status e responsável são recém-lidos
    // antes das escritas (fecha janela TOCTOU com conclusão/reatribuição).
    const context = await repository.findMappingRequestContext(trx, protocol.trim());
    if (!context) {
      throw new AppError("Solicitação não encontrada", 404);
    }

    if (actor.role === "Gestor") {
      await recordMappingAccessDenied(
        context.protocol,
        actor.id,
        "perfil Gestor é somente leitura",
        ipAddress,
      );
      throw new AppError(
        "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
        403,
        "INSUFFICIENT_ROLE_PERMISSIONS",
      );
    }

    // Status terminais não aceitam edição (não reabre fluxo encerrado).
    // Motor de Status v4: guard por `isTerminal` (não por lista de nomes).
    if (context.is_terminal) {
      await recordMappingAccessDenied(context.protocol, actor.id, "demanda encerrada", ipAddress);
      throw new AppError("Solicitação encerrada.", 422);
    }

    // Priorizado (isRestricted) bloqueia o PUT de qualquer perfil — inclusive
    // Admin/designado → movimentação de/r para Priorizado só via `PATCH /status`
    // (delta v4 §3.2: "Priorizado só via override").
    if (context.is_restricted) {
      await recordMappingAccessDenied(context.protocol, actor.id, "demanda priorizada", ipAddress);
      throw new AppError(
        "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
        403,
        "INSUFFICIENT_ROLE_PERMISSIONS",
      );
    }

    const isAdmin = actor.role === "Administrador";
    const isRequestAssignee =
      context.assignee_user_id !== null && Number(context.assignee_user_id) === actor.id;
    const isRequestMappingAssignee =
      context.mapping_assignee_user_id !== null &&
      Number(context.mapping_assignee_user_id) === actor.id;

    const mapping = payload.id
      ? await repository.findMappingById(trx, context.request_id, payload.id)
      : await repository.findLatestOpenMapping(trx, context.request_id);

    if (payload.id !== undefined && !mapping) {
      throw new AppError("Mapeamento não encontrado.", 404);
    }
    if (mapping && mapping.is_concluded) {
      throw new AppError("Este mapeamento já foi concluído e não pode ser editado.", 422);
    }

    const previousProfessionalId = mapping ? mapping.professional_id : null;

    // Autorização — dois vínculos distintos (contrato §9):
    // - Designação (`mappingAssigneeId` presente): responsável da solicitação
    //   (dono pode delegar) ou Admin; o designado atual também pode (re)designar.
    // - Campos do mapeamento (com ou sem designação): o designado ATUAL ou Admin.
    //   Criação sem designação herda o responsável — o próprio responsável pode
    //   criar (ele será o designado efetivo).
    // - `mappingAssigneeId: null` em CRIAÇÃO não tem o que remover: equivale a
    //   herdar o responsável (evita mapeamento órfão que ninguém edita).
    const explicitDesignation = payload.mappingAssigneeId !== undefined;
    const isNullOnCreate = !mapping && explicitDesignation && payload.mappingAssigneeId === null;
    const designationAction = explicitDesignation && !isNullOnCreate;

    const priorDesigneeUserId =
      mapping?.professional_id === null
        ? null
        : ((await repository.findMappingAssigneeCandidate(trx, mapping?.professional_id ?? null))
            ?.userId ?? null);
    const isPriorMappingAssignee =
      priorDesigneeUserId !== null && Number(priorDesigneeUserId) === actor.id;
    // Decisão: o designado ATUAL edita mesmo com `details_professional.status`
    // inativo — o ator está logado e ativo (authMiddleware revalida por request).
    const canCreateByInheritance =
      !mapping &&
      (isRequestAssignee || isRequestMappingAssignee) &&
      (payload.mappingAssigneeId === undefined || isNullOnCreate);
    const isCurrentMappingAssignee =
      isPriorMappingAssignee ||
      (!mapping && isRequestMappingAssignee) ||
      (mapping?.professional_id === null && isRequestMappingAssignee);
    const canDesignate = isAdmin || isRequestAssignee || isCurrentMappingAssignee;
    const canEditContent = isAdmin || isCurrentMappingAssignee || canCreateByInheritance;

    // Autorização em DOIS eixos INDEPENDENTES: a presença de `mappingAssigneeId`
    // não isenta a checagem de edição. `contentAction` = tentativa de alterar
    // campos ou concluir o mapeamento (designado atual e Admin passam em ambos).
    const contentAction =
      payload.scheduledFor !== undefined ||
      payload.durationMinutes !== undefined ||
      payload.modality !== undefined ||
      payload.meetingLink !== undefined ||
      payload.location !== undefined ||
      payload.notes !== undefined ||
      payload.participants !== undefined ||
      payload.targetStatus !== undefined ||
      payload.justification !== undefined ||
      payload.lastTechnicalMessage !== undefined ||
      payload.completeMapping === true;

    if (!contentAction && !designationAction) {
      throw new AppError("Informe ao menos um campo para atualizar o mapeamento.", 400);
    }

    if (designationAction && !canDesignate) {
      await recordMappingAccessDenied(
        context.protocol,
        actor.id,
        "sem permissão para designar o mapeamento",
        ipAddress,
      );
      throw new AppError(
        "Você não tem permissão para designar o mapeamento: apenas o responsável pela solicitação ou Administrador.",
        403,
        "INSUFFICIENT_ROLE_PERMISSIONS",
      );
    }
    if (contentAction && !canEditContent) {
      await recordMappingAccessDenied(
        context.protocol,
        actor.id,
        "sem custódia para editar o mapeamento",
        ipAddress,
      );
      throw new AppError(
        "Você não tem permissão para editar este mapeamento.",
        403,
        "INSUFFICIENT_ROLE_PERMISSIONS",
      );
    }

    // Designação efetiva: `mappingAssigneeId` (uuid de details_professional).
    // Ausente (ou `null` em criação) = mantém o atual / herda o responsável.
    let effectiveProfessionalId: string | null;
    if (payload.mappingAssigneeId !== undefined && !isNullOnCreate) {
      const candidate = await repository.findMappingAssigneeCandidate(
        trx,
        payload.mappingAssigneeId,
      );
      if (payload.mappingAssigneeId !== null && !candidate) {
        throw new AppError("Designado não encontrado.", 422);
      }
      if (candidate) {
        assertCandidateEligible(candidate);
      }

      effectiveProfessionalId = payload.mappingAssigneeId;
    } else {
      // Sem designação explícita: mantém o atual; ao CRIAR, herda o responsável
      // pela solicitação (ponto de partida — a delegação vem depois).
      effectiveProfessionalId = mapping
        ? mapping.professional_id
        : (context.mapping_professional_id ?? context.professional_id);
    }

    const currentValues = mapping ? rowToValues(mapping) : emptyValues();
    let values = mergeValues(currentValues, payload);

    const concluding = payload.completeMapping;
    let concludeTarget: repository.MappingTargetRow | null = null;
    if (concluding) {
      if (payload.targetStatus === undefined) {
        throw new ValidationError(
          { targetStatus: "Informe o status de destino ao concluir o mapeamento" },
          "Validação falhou",
        );
      }

      const target = await repository.resolveMappingTarget(trx, payload.targetStatus);
      if (!target) {
        throw new ValidationError(
          {
            targetStatus: "Status deve ter mappingMode conclusion_only e isRestricted=false",
          },
          "Validação falhou",
        );
      }
      if (target.status_id !== 6) {
        if (payload.justification === undefined) {
          throw new ValidationError(
            {
              justification:
                "Justificativa obrigatória ao concluir o mapeamento (1..4000 caracteres).",
            },
            "Validação falhou",
          );
        }
        if (target.isPublic && payload.lastTechnicalMessage == null) {
          throw new ValidationError(
            {
              lastTechnicalMessage:
                "Retorno ao solicitante obrigatório para status público (1..4000 caracteres).",
            },
            "Validação falhou",
          );
        }
        values = emptyValues();
      } else {
        validateModality(values);
        const missing = missingFieldForCompletion(values);
        if (missing) {
          throw new AppError(`Revise os campos do mapeamento: informe "${missing}".`, 422);
        }
      }
      concludeTarget = target;
    } else {
      validateModality(values);
    }

    const resolvedParticipants =
      concluding && concludeTarget?.status_id !== 6
        ? []
        : payload.participants !== undefined
          ? await resolveParticipants(trx, payload.participants)
          : undefined;

    const designationChanged =
      designationAction && effectiveProfessionalId !== previousProfessionalId;

    let mappingId: string;
    if (mapping) {
      mappingId = mapping.mapping_id;
    } else {
      mappingId = await repository.insertMapping(trx, {
        requestId: context.request_id,
        professionalId: effectiveProfessionalId,
        values,
        targetStatus: concludeTarget?.status_id ?? null,
        justification:
          concludeTarget && concludeTarget.status_id !== 6 ? payload.justification : null,
        lastTechnicalMessage: concludeTarget?.isPublic ? payload.lastTechnicalMessage : null,
        createdBy: actor.email,
      });
    }

    await repository.updateMapping(
      trx,
      mappingId,
      values,
      actor.email,
      concluding,
      designationAction ? effectiveProfessionalId : undefined,
      concludeTarget?.status_id ?? null,
      concludeTarget && concludeTarget.status_id !== 6 ? payload.justification : null,
      concludeTarget?.isPublic ? payload.lastTechnicalMessage : null,
    );

    if (resolvedParticipants) {
      await repository.replaceMappingParticipants(trx, mappingId, resolvedParticipants);
    }

    const changeOrigin = actor.role === "Administrador" ? "admin" : "internal";

    // Diff completo inclui o designado vigente: cada save registra quem executa,
    // além da mudança pontual de designação (`mapping.assign`).
    const previousAuditValues = mapping
      ? {
          ...currentValues,
          mappingAssigneeId: mapping.professional_id,
          targetStatus: mapping.target_status_id ?? null,
        }
      : null;
    const nextAuditValues = {
      ...values,
      mappingAssigneeId: effectiveProfessionalId,
      targetStatus: concludeTarget?.status_id ?? mapping?.target_status_id ?? null,
      justification: concludeTarget?.status_id === 6 ? null : (payload.justification ?? null),
      lastTechnicalMessage: concludeTarget?.isPublic
        ? (payload.lastTechnicalMessage ?? null)
        : null,
    };

    await recordAudit(trx, {
      entityType: "mapping",
      actionType: concluding ? "mapping.complete" : "mapping.save",
      entityId: mappingId,
      userId: actor.id,
      previousValue: previousAuditValues ? JSON.stringify(previousAuditValues) : null,
      newValue: JSON.stringify(nextAuditValues),
      ipAddress,
      changeOrigin,
    });

    if (designationChanged) {
      await recordAudit(trx, {
        entityType: "mapping",
        actionType: "mapping.assign",
        entityId: mappingId,
        userId: actor.id,
        previousValue: previousProfessionalId,
        newValue: effectiveProfessionalId,
        ipAddress,
        changeOrigin,
      });
    }

    if (concluding && concludeTarget) {
      await applyStatusTransition(trx, {
        requestId: context.request_id,
        target: {
          status_id: concludeTarget.status_id,
          name: concludeTarget.name,
          isPublic: concludeTarget.isPublic,
        },
        updatedBy: actor.email,
        lastTechnicalMessage: concludeTarget.isPublic ? payload.lastTechnicalMessage : null,
        expectedStatusId: context.status_id,
      });

      await trx("requests")
        .where({ request_id: context.request_id })
        .update({
          meeting_scheduled_for: concludeTarget.status_id === 6 ? values.scheduledFor : null,
          meeting_link: concludeTarget.status_id === 6 ? values.meetingLink : null,
          last_external_update_at: trx.fn.now(),
        });

      await recordAudit(trx, {
        entityType: "request",
        actionType: "request.status_change",
        entityId: context.protocol,
        userId: actor.id,
        previousValue: context.status,
        newValue: concludeTarget.name,
        // `note` = justificativa interna (id 6 não exige); o retorno público
        // vira snapshot dedicado apenas quando o destino é público.
        note: concludeTarget.status_id === 6 ? null : (payload.justification ?? null),
        lastTechnicalMessage: concludeTarget.isPublic
          ? (payload.lastTechnicalMessage ?? null)
          : null,
        ipAddress,
        changeOrigin: "system",
      });

      // Liberação automática do designado quando o mapeamento é concluído de
      // fato (`targetStatus !== 6`) — agendar (6) mantém o designado. Evento só
      // quando havia vínculo: `mapping.assign` com `newValue: null` = remoção.
      if (concludeTarget.status_id !== 6 && context.mapping_professional_id !== null) {
        await repository.clearRequestMappingAssignee(trx, context.request_id, actor.email);
        await recordAudit(trx, {
          entityType: "mapping",
          actionType: "mapping.assign",
          entityId: mappingId,
          userId: actor.id,
          previousValue: context.mapping_professional_id,
          newValue: null,
          ipAddress,
          changeOrigin: "system",
        });
      }
    }

    // Resposta construída sem reload: participantes enviados (já resolvidos)
    // ou a lista persistida (quando o payload não os trouxe).
    const savedParticipants: repository.MappingParticipantRow[] = resolvedParticipants
      ? resolvedParticipants.map((participant) => ({
          userId: participant.userId,
          name: participant.name,
          email: participant.email,
        }))
      : await repository.findMappingParticipants(trx, mappingId);

    const assigneeCandidate = await repository.findMappingAssigneeCandidate(
      trx,
      effectiveProfessionalId,
    );

    return mappingResponseFromValues(
      context.protocol,
      mappingId,
      concludeTarget?.status_id ?? mapping?.target_status_id ?? null,
      values,
      savedParticipants,
      toMappingAssignee(assigneeCandidate),
    );
  });
};
