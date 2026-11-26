import { describe, expect, it } from "vitest";
import { describeFailure } from "../../src/shared/utils/describeFailure.ts";

describe("describeFailure", () => {
  it("remove SQL, tabela e PII da mensagem do driver", () => {
    const error = Object.assign(
      new Error(
        'insert into "requests" ("email", "cpf") values (\'maria@empresa.com\', \'123.456.789-00\') - duplicate key value violates unique constraint "requests_email_key" for maria@empresa.com 123.456.789-00',
      ),
      { code: "23505" },
    );

    const description = describeFailure(error);

    expect(description).toContain("23505");
    expect(description).toContain("duplicate key value");
    expect(description).not.toContain("insert");
    expect(description).not.toContain("requests");
    expect(description).not.toContain("maria@empresa.com");
    expect(description).not.toContain("123.456.789-00");
  });

  it("não descarta a causa de uma string lançada", () => {
    const description = describeFailure(
      "update \"requests\" set status_id = 13 where protocol = 'MAAT-1'",
    );

    expect(description).toContain("[sql omitido]");
    expect(description).not.toContain("update");
    expect(description).not.toContain("requests");
    expect(description).not.toContain("MAAT-1");
  });

  it("lê message/name/code de um erro error-like", () => {
    const description = describeFailure({
      name: "DatabaseError",
      code: "23502",
      message:
        'null value in column "protocol" of relation "requests" violates not-null constraint',
    });

    expect(description).toContain("DatabaseError");
    expect(description).toContain("23502");
    expect(description).toContain("violates not-null constraint");
    expect(description).not.toContain("requests");
  });

  it("preserva o nome quando a mensagem está vazia", () => {
    expect(describeFailure(new Error(""))).toBe("Error");
  });

  it("identifica throws primitivos desconhecidos", () => {
    expect(describeFailure(42)).toBe("erro desconhecido (42)");
    expect(describeFailure(null)).toBe("erro desconhecido (null)");
  });

  it("trunca mensagens longas", () => {
    const description = describeFailure(new Error("a".repeat(400)));

    expect(description.length).toBeLessThanOrEqual(310);
    expect(description.endsWith("...")).toBe(true);
  });
});
