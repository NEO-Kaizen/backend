import { AppError } from "./AppError.ts";

/**
 * Erro de validação com erros por campo — responde `422`.
 *
 * `fields` é indexado pelas chaves exibidas pela UI (ex.:
 * `operational.hasManualControlsDetail`), conforme
 * `src/shared/validation/zodErrors.ts` (`buildZodFieldErrors`).
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>, message: string) {
    super(message, 422);
    this.name = "ValidationError";
    this.fields = fields;
  }
}
