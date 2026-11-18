/**
 * Identificadores de domínio.
 *
 * `Uuid` é um refinamento textual: a validação de runtime continua sendo feita
 * nas bordas (schemas/guards). O tipo documenta a intenção e evita confundir
 * UUID (`details_professional.professional_id`) com `user_id` numérico.
 */
export type Uuid = `${string}-${string}-${string}-${string}-${string}`;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): value is Uuid {
  return UUID_PATTERN.test(value);
}
