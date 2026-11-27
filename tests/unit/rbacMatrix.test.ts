import { describe, expect, it } from "vitest";
import { BASE_PROFILES } from "../../src/shared/catalog/baseProfiles.ts";
import { PERMISSION_CATALOG } from "../../src/shared/catalog/permissionCatalog.ts";

function profile(name: string) {
  const found = BASE_PROFILES.find((candidate) => candidate.profileName === name);
  if (!found) throw new Error(`Perfil base ausente: ${name}`);
  return found;
}

function grantOf(profileName: string, key: string) {
  return profile(profileName).permissions.find((permission) => permission.key === key);
}

describe("matriz de perfis base — atribuição", () => {
  it("o Analista não recebe request:assign", () => {
    expect(grantOf("Analista", "request:assign")).toBeUndefined();
  });

  it("o perfil de leitura (Gestor) não recebe request:assign", () => {
    expect(grantOf("Gestor", "request:assign")).toBeUndefined();
  });

  it("Administrador e Admin Root atribuem qualquer solicitação", () => {
    expect(grantOf("Administrador", "request:assign")).toEqual({
      key: "request:assign",
      custody: "all",
    });
    expect(grantOf("Admin Root", "request:assign")).toEqual({
      key: "request:assign",
      custody: "all",
    });
  });
});

describe("matriz de perfis base — composição", () => {
  it("cobre exatamente o catálogo para os perfis com todas as chaves", () => {
    for (const name of ["Administrador", "Admin Root"]) {
      expect(profile(name).permissions.map((permission) => permission.key)).toEqual(
        PERMISSION_CATALOG.map((entry) => entry.key),
      );
    }
  });

  it("o Analista mantém as chaves de escrita da solicitação sem atribuir", () => {
    expect(grantOf("Analista", "request:write")?.custody).toBe("assigned");
    expect(grantOf("Analista", "request:status_change")?.custody).toBe("assigned");
    expect(grantOf("Analista", "triage:write")?.custody).toBe("assigned");
    expect(grantOf("Analista", "pending_item:review")?.custody).toBe("assigned");
  });
});
