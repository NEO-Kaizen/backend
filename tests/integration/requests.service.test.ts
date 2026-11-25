import { afterEach, describe, expect, it, vi } from "vitest";
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

vi.mock("../../src/modules/requests/requests.repository.ts", () => ({
  findRequestByProtocolWithOwner: vi.fn(),
  findInternalRequestByProtocol: vi.fn(),
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
      detail,
    });

    await expect(requestsService.findRequest(PROTOCOL, 1)).resolves.toEqual(detail);
  });

  it("não aplica ownership no modo público (sem usuário)", async () => {
    vi.mocked(repository.findRequestByProtocolWithOwner).mockResolvedValue({
      requesterEmail: "outra@neo.com",
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
        user: { id: "2", name: "Outro", email: "outro@neo.com", role: "Solicitante" },
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
        user: { id: "1", name: "Maria", email: "maria@neo.com", role: "Solicitante" },
        requesterIdentity: null,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("bloqueia perfil interno no acompanhamento do solicitante", async () => {
    await expect(
      requestsService.getTracking(PROTOCOL, {
        user: { id: "1", name: "Ana", email: "ana@neo.com", role: "Analista" },
        requesterIdentity: null,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repository.findInternalRequestByProtocol).not.toHaveBeenCalled();
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
