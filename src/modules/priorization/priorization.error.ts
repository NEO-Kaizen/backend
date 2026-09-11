import type { ErroValidacaoCampo } from "../../shared/types/priorization.js";

export class ValidacaoError extends Error {
  campos: ErroValidacaoCampo[];

  constructor(campos: ErroValidacaoCampo[]) {
    super("Erro de validação nas notas de priorização");
    this.name = "ValidacaoError";
    this.campos = campos;
  }
}