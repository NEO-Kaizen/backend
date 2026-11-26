import type { Knex } from "knex";

/** Fuso comercial usado pelo dashboard. */
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

const UTC_TIME_ZONE = "UTC";

export interface DayRange {
  from?: string;
  to?: string;
}

/** Mantido como alias para os consumidores do recorte comercial. */
export type BusinessDayRange = DayRange;

/**
 * Datas no formato `AAAA-MM-DD` podem ser comparadas como texto; a Ordem
 * lexicográfica coincide com a cronológica.
 */
export function isOrderedDateRange({ from, to }: DayRange): boolean {
  return !from || !to || from <= to;
}

/**
 * Recorte inclusivo em dias de um fuso. `to` vira um intervalo semiaberto
 * (`< to + 1 dia`), então um registro no fim do dia não escapa por causa do
 * horário. `column` é identificador interno, nunca entrada do cliente.
 */
function whereDayRange(
  query: Knex.QueryBuilder,
  column: string,
  { from, to }: DayRange,
  timeZone: string,
): void {
  // `::date AT TIME ZONE` resolve para `timestamptz → timestamp` no Postgres e
  // deslocaria a borda para 21h do dia anterior em UTC. O cast explícito para
  // `timestamp` força a leitura da data como horário local no fuso informado.
  if (from) {
    query.whereRaw(`?? >= (?::date::timestamp AT TIME ZONE ?)`, [column, from, timeZone]);
  }

  if (to) {
    query.whereRaw(`?? < ((?::date + INTERVAL '1 day')::timestamp AT TIME ZONE ?)`, [
      column,
      to,
      timeZone,
    ]);
  }
}

/** Recorte comercial usado pelo dashboard (issue #215). */
export function whereBusinessDayRange(
  query: Knex.QueryBuilder,
  column: string,
  range: DayRange,
): void {
  whereDayRange(query, column, range, BUSINESS_TIME_ZONE);
}

/** Recorte em UTC usado pela fila e pela exportação CSV (contrato RF04). */
export function whereUtcDayRange(query: Knex.QueryBuilder, column: string, range: DayRange): void {
  whereDayRange(query, column, range, UTC_TIME_ZONE);
}
