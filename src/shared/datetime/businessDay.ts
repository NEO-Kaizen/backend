import type { Knex } from "knex";

/** Fuso comercial usado por fila, dashboard e exportação. */
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

export interface BusinessDayRange {
  from?: string;
  to?: string;
}

/**
 * Datas no formato `AAAA-MM-DD` podem ser comparadas como texto; a Ordem
 * lexicográfica coincide com a cronológica.
 */
export function isOrderedDateRange({ from, to }: BusinessDayRange): boolean {
  return !from || !to || from <= to;
}

/**
 * Recorte inclusivo em dias comerciais. `to` vira um intervalo semiaberto
 * (`< to + 1 dia`), então um registro no fim do dia não escapa por causa do
 * horário. `column` é identificador interno, nunca entrada do cliente.
 */
export function whereBusinessDayRange(
  query: Knex.QueryBuilder,
  column: string,
  { from, to }: BusinessDayRange,
): void {
  // `::date AT TIME ZONE` resolve para `timestamptz → timestamp` no Postgres e
  // deslocaria a borda para 21h do dia anterior em UTC. O cast explícito para
  // `timestamp` força a leitura da data como horário local no fuso comercial.
  if (from) {
    query.whereRaw(`?? >= (?::date::timestamp AT TIME ZONE ?)`, [column, from, BUSINESS_TIME_ZONE]);
  }

  if (to) {
    query.whereRaw(`?? < ((?::date + INTERVAL '1 day')::timestamp AT TIME ZONE ?)`, [
      column,
      to,
      BUSINESS_TIME_ZONE,
    ]);
  }
}
