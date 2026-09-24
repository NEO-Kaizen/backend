// DTOs do subfluxo de Mapeamento (`/queue/requests/:protocol/mapping`).
// Contrato fechado com o frontend em `contrato-mapeamento.md` (issue #86).
//
// `id` do participante referencia `users.user_id`; quando ausente, o
// participante é externo (nome/e-mail enviados no payload). O `id` do
// mapeamento (`MappingResponse.id`) é o `mapping_id` (uuid).

export type MappingModality = "REMOTE" | "IN_PERSON";

/**
 * Participante na RESPOSTA (GET/PUT): `id` é o `users.user_id` serializado
 * como string quando cadastrado; `null` para participante externo (não há
 * identidade cadastrada para ecoar de volta ao PUT).
 */
export interface MappingParticipant {
  id: string | null;
  name: string;
  email: string;
}

/**
 * Participante no PAYLOAD do PUT: `id` opcional — quando presente, referencia
 * `users.user_id` (usuário cadastrado — o banco resolve nome/e-mail do
 * cadastro); ausente = participante externo.
 */
export interface MappingParticipantInput {
  id?: string;
  name: string;
  email: string;
}

/** Valores do mapeamento já mesclados (campos simples, sem participantes). */
export interface MappingValues {
  scheduledFor: string | null;
  durationMinutes: number | null;
  modality: MappingModality | null;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
}

/** Participante resolvido para persistência (id de usuário ou externo). */
export interface ResolvedParticipant {
  userId: number | null;
  name: string;
  email: string;
}

/**
 * Designado para EXECUTAR o mapeamento — vínculo próprio e distinto do
 * responsável pela solicitação (ambos são profissionais; podem ser a mesma
 * pessoa, mas são atribuições independentes).
 *
 * `id` = `details_professional.professional_id` (uuid) — ecoável no
 * `mappingAssigneeId` do payload. `userId` = `users.user_id` (int, string) —
 * usado na comparação `mappingAssigneeId === currentUser.id` (contrato §9).
 */
export interface MappingAssignee {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
}

/** Resposta de `GET`/`PUT` — `id` identifica o mapeamento (para o PUT direcionar).
 * `null` no estado vazio (sem mapeamento registrado).
 * `mappingAssignee` é o designado do mapeamento (ou `null`); ao criar um
 * mapeamento, ele herda o responsável da solicitação até ser re-designado. */
export interface MappingResponseDTO {
  protocol: string;
  id: string | null;
  scheduledFor: string | null;
  durationMinutes: number | null;
  modality: MappingModality | null;
  meetingLink: string | null;
  location: string | null;
  participants: MappingParticipant[];
  notes: string | null;
  mappingAssignee: MappingAssignee | null;
}

/**
 * Payload do `PUT`. Semântica: campo **ausente** mantém o valor atual;
 * `null` limpa; `participants` presente substitui a lista por completo.
 * `mappingAssigneeId` (uuid de `details_professional`) designa/substitui/
 * remove o profissional que executará o mapeamento — ausente mantém o atual;
 * permitido apenas ao responsável da solicitação ou Administrador.
 * `completeMapping` é exclusivo do `PUT` (não aparece na resposta).
 * `targetStatus` (PortalStatus.id) é obrigatório quando `completeMapping:true`
 * — status de destino do fluxo de mapeamento (delta v4 §3.2).
 * `justification` (1..4000) é obrigatória quando `completeMapping:true` —
 * toda mudança de status exige justificativa (delta §3.3).
 */
export interface MappingPayloadDTO {
  id?: string;
  mappingAssigneeId?: string | null;
  scheduledFor?: string | null;
  durationMinutes?: number | null;
  modality?: MappingModality | null;
  meetingLink?: string | null;
  location?: string | null;
  participants?: MappingParticipantInput[];
  notes?: string | null;
  completeMapping: boolean;
  targetStatus?: number;
  justification?: string;
}

/** Ator autenticado com o perfil resolvido (do `authMiddleware`). */
export interface MappingActor {
  id: number;
  email: string;
  role: "Solicitante" | "Analista" | "Gestor" | "Administrador";
}
