import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEffectivePermissions } from "../../src/shared/catalog/permissionCatalog.ts";
import { makeAuthUser } from "../helpers/factories.ts";
import { resetFakeDb } from "../helpers/fakeDb.ts";
import type { InternalRequestRow } from "../../src/shared/types/requests.ts";
import type { RequestDetail } from "../../src/modules/DTOs/requests/RequestResponse.dto.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  findUserById: vi.fn(),
}));

vi.mock("../../src/modules/portalConfig/portalConfig.repository.ts", () => ({
  getSolicitationMode: vi.fn(),
}));

vi.mock("../../src/shared/audit/auditLogger.ts", () => ({ recordAudit: vi.fn() }));

vi.mock("../../src/modules/requests/requests.repository.ts", () => ({
  findRequestByProtocolWithOwner: vi.fn(),
  findInternalRequestByProtocol: vi.fn(),
  findAttachmentsByRequestId: vi.fn(),
  findSchedulePreferencesByRequestId: vi.fn(),
  findEvaluationByProtocol: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const portalConfigRepository =
  await import("../../src/modules/portalConfig/portalConfig.repository.ts");
const repository = await import("../../src/modules/requests/requests.repository.ts");
const requestsService = await import("../../src/modules/requests/requests.service.ts");

const PROTOCOL = "MAAT-ABCD-EFGH";
const detail = { protocol: PROTOCOL } as RequestDetail;

afterEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

describe("requests.service.findRequest — ownership", () => {
  it("retorna 404 (anti-enumeração) quando a solicitação é de outro e-mail", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 1, email: "maria@neo.com" }),
    );
    vi.mocked(repository.findRequestByProtocolWithOwner).mockResolvedValue({
      requesterEmail: "outra@neo.com",
      requesterUserId: null,
      detail,
    });

    await expect(requestsService.findRequest(PROTOCOL, 1)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("devolve a solicitação quando o e-mail do cadastro é o dono", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 1, email: "maria@neo.com" }),
    );
    vi.mocked(repository.findRequestByProtocolWithOwner).mockResolvedValue({
      requesterEmail: "  MARIA@neo.com ",
      requesterUserId: null,
      detail,
    });

    await expect(requestsService.findRequest(PROTOCOL, 1)).resolves.toEqual(detail);
  });

  it("usa o vínculo requester_user_id como fonte primária da Posse", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(
      makeAuthUser({ user_id: 1, email: "novo-email@neo.com" }),
    );
    vi.mocked(repository.findRequestByProtocolWithOwner).mockResolvedValue({
      requesterEmail: "email-antigo@neo.com",
      requesterUserId: 1,
      detail,
    });

    await expect(requestsService.findRequest(PROTOCOL, 1)).resolves.toEqual(detail);
  });

  it("não aplica ownership no modo público (sem usuário)", async () => {
    vi.mocked(repository.findRequestByProtocolWithOwner).mockResolvedValue({
      requesterEmail: "outra@neo.com",
      requesterUserId: null,
      detail,
    });

    await expect(requestsService.findRequest(PROTOCOL)).resolves.toEqual(detail);
    expect(authRepository.findUserById).not.toHaveBeenCalled();
  });
});

describe("requests.service.getTracking — ownership", () => {
  const ownerRow = {
    requester_user_id: 1,
    requester_email: "maria@neo.com",
    requester_name: "Maria",
  } as unknown as InternalRequestRow;

  it("retorna 404 para protocolo de terceiro na sessão autenticada", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(ownerRow);

    await expect(
      requestsService.getTracking(PROTOCOL, {
        user: {
          id: "2",
          name: "Outro",
          email: "outro@neo.com",
          profileId: "1",
          profileName: "Solicitante",
        },
        requesterIdentity: null,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("retorna 404 quando o vínculo requester_user_id aponta para outro usuário", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue({
      ...ownerRow,
      requester_user_id: 2,
      requester_email: "maria@neo.com",
    } as InternalRequestRow);

    await expect(
      requestsService.getTracking(PROTOCOL, {
        user: {
          id: "1",
          name: "Maria",
          email: "maria@neo.com",
          profileId: "1",
          profileName: "Solicitante",
        },
        requesterIdentity: null,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("não projeta acompanhamento para Perfil interno sem Posse (a chave request:track é o gate da rota)", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(ownerRow);

    await expect(
      requestsService.getTracking(PROTOCOL, {
        user: {
          id: "2",
          name: "Ana",
          email: "ana@neo.com",
          profileId: "2",
          profileName: "Analista",
        },
        requesterIdentity: null,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findInternalRequestByProtocol).toHaveBeenCalledOnce();
  });

  it("não permite acompanhamento público no modo AUTHENTICATED", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("AUTHENTICATED");

    await expect(
      requestsService.getTracking(PROTOCOL, {
        user: undefined,
        requesterIdentity: { name: "Maria", email: "maria@neo.com" },
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("usa 401 genérico para identidade pública divergente", async () => {
    vi.mocked(portalConfigRepository.getSolicitationMode).mockResolvedValue("PUBLIC");
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(ownerRow);

    await expect(
      requestsService.getTracking(PROTOCOL, {
        user: undefined,
        requesterIdentity: { name: "Outra", email: "outra@neo.com" },
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

/** Linha mínima da visão interna para exercitar custódia e redaction. */
function internalRow(overrides: Record<string, unknown> = {}) {
  return {
    request_id: "9001",
    protocol: PROTOCOL,
    status: "Aguardando mapeamento",
    priority: null,
    requester_name: "Ana Paula",
    requester_email: "ana@empresa.com",
    requester_area: "Financeiro",
    requester_department: null,
    requester_manager: "Carlos",
    requester_additional_contact: null,
    title: "Automatizar conciliação",
    request_type: "Automação",
    category: "Automação",
    process_name: "Conciliação",
    need_description: "Descrição",
    problem_opportunity: "Problema",
    expected_result: "Resultado",
    justification: "Justificativa",
    process_description: "Processo",
    process_steps: "Etapas",
    systems_used: "ERP",
    execution_frequency: "Diária",
    approximate_volume: "100",
    people_involved: 2,
    average_duration: "30 min",
    estimated_monthly_effort: "10",
    has_manual_controls: false,
    manual_controls_detail: null,
    main_risks: "Baixo",
    client_impact: "Baixo",
    operational_impact: "Médio",
    desired_deadline: "2099-12-31",
    perceived_criticality: "Alta",
    has_process_documentation: false,
    process_documentation_detail: null,
    has_similar_solution: false,
    similar_solution_detail: null,
    depends_on_other_areas: false,
    other_areas_detail: null,
    handles_restricted_info: false,
    restricted_info_detail: null,
    additional_notes: null,
    internal_notes: JSON.stringify({ observations: "segredo interno" }),
    meeting_scheduled_for: null,
    meeting_link: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    requester_user_id: null,
    assignee_user_id: null,
    mapping_user_id: null,
    ...overrides,
  };
}

function actorWith(
  permissions: Array<{ permission_key: string; custody: "global" | "own" | "assigned" | "all" }>,
) {
  return { id: 7, email: "mapeador@neo.com", permissions: buildEffectivePermissions(permissions) };
}

describe("requests.service.findInternalByProtocol — custódia de leitura", () => {
  it("permite ao designado do mapeamento ler a solicitação", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(
      internalRow({ assignee_user_id: null, mapping_user_id: 7 }) as never,
    );
    vi.mocked(repository.findAttachmentsByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findSchedulePreferencesByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findEvaluationByProtocol).mockResolvedValue(undefined);

    const result = await requestsService.findInternalByProtocol(
      PROTOCOL,
      actorWith([{ permission_key: "request:read", custody: "assigned" }]),
    );

    expect(result.protocol).toBe(PROTOCOL);
  });

  it("redige Observações internas e Pendências sem as chaves próprias", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(
      internalRow({ assignee_user_id: null, mapping_user_id: 7 }) as never,
    );
    vi.mocked(repository.findAttachmentsByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findSchedulePreferencesByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findEvaluationByProtocol).mockResolvedValue(undefined);

    const result = await requestsService.findInternalByProtocol(
      PROTOCOL,
      actorWith([{ permission_key: "request:read", custody: "assigned" }]),
    );

    expect(result.internalObservations).toBeNull();
    expect(result.pendingSummary).toMatchObject({ total: 0 });
    expect(result.unread).toMatchObject({ count: 0, hasUnread: false });
    expect(result.correctionAlert).toBeNull();
  });

  it("mantém Observações internas para o responsável da triagem com a chave", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(
      internalRow({ assignee_user_id: 7, mapping_user_id: null }) as never,
    );
    vi.mocked(repository.findAttachmentsByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findSchedulePreferencesByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findEvaluationByProtocol).mockResolvedValue(undefined);

    const result = await requestsService.findInternalByProtocol(
      PROTOCOL,
      actorWith([
        { permission_key: "request:read", custody: "assigned" },
        { permission_key: "internal_note:read", custody: "assigned" },
      ]),
    );

    expect(result.internalObservations).toBe("segredo interno");
  });

  it("permite ao designado do mapeamento ler Observações internas com a chave", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(
      internalRow({ assignee_user_id: null, mapping_user_id: 7 }) as never,
    );
    vi.mocked(repository.findAttachmentsByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findSchedulePreferencesByRequestId).mockResolvedValue([]);
    vi.mocked(repository.findEvaluationByProtocol).mockResolvedValue(undefined);

    const result = await requestsService.findInternalByProtocol(
      PROTOCOL,
      actorWith([
        { permission_key: "request:read", custody: "assigned" },
        { permission_key: "internal_note:read", custody: "assigned" },
      ]),
    );

    expect(result.internalObservations).toBe("segredo interno");
  });

  it("recusa quem não é responsável da triagem nem do mapeamento", async () => {
    vi.mocked(repository.findInternalRequestByProtocol).mockResolvedValue(
      internalRow({ assignee_user_id: 99, mapping_user_id: 98 }) as never,
    );

    await expect(
      requestsService.findInternalByProtocol(
        PROTOCOL,
        actorWith([{ permission_key: "request:read", custody: "assigned" }]),
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: "request_not_found" });
  });
});
