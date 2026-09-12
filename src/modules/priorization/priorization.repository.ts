import db from "../../database/conection.ts";
import type { Criterio, Classificacao, HistoricoItem, CriterioRow, AvaliacaoRow } from "../../shared/types/priorization.ts";

export async function runTransaction<T>(callback: (trx: typeof db) => Promise<T>): Promise<T> {
    return await db.transaction(async (trx) => {
        return await callback(trx);
    });
}

export async function getCriteriosAtivos(): Promise<Criterio[]> {
    const rows: CriterioRow[] = await db("criteria").where({ active: true }).orderBy("display_order", "asc");
    return rows.map((row) => ({
        id: row.criterion_id,
        nome: row.name,
        peso: row.weight,
        ativo: row.active,
    }));
}

export async function getAllCriterios(): Promise<Criterio[]> {
    const rows: CriterioRow[] = await db("criteria").orderBy("display_order", "asc");
    return rows.map((row) => ({
        id: row.criterion_id,
        nome: row.name,
        peso: row.weight,
        ativo: row.active,
    }));
}

export async function getCriterioPorId(criterionId: string): Promise<Criterio | null> {
    const row = await db("criteria").where({ criterion_id: criterionId }).first<CriterioRow>();
    if (!row) return null;
    return {
        id: row.criterion_id,
        nome: row.name,
        peso: row.weight,
        ativo: row.active,
    };
}

export async function getAvaliacaoAtual(protocolo: string, trx?: typeof db): Promise<AvaliacaoRow | null> {
    const query = trx ? trx("avaliacoes") : db("avaliacoes");
    const row = await query.where({ protocolo }).orderBy("created_at", "desc").first<AvaliacaoRow>();
    return row || null;
}

export async function salvarNotas(protocolo: string, notas: Record<string, number>, criterios: Criterio[], trx?: typeof db): Promise<void> {
    const insertData = criterios.map((c) => ({
        protocolo,
        criterio_id: c.id,
        nota: notas[c.id],
    }));
    const query = trx ? trx("notas") : db("notas");
    await query.insert(insertData).onConflict(["protocolo", "criterio_id"]).merge({ nota: trx ? trx.raw("excluded.nota") : db.raw("excluded.nota") });
}

export async function upsertAvaliacao(protocolo: string, score: number, classificacao: Classificacao, usuarioId: string, trx?: typeof db): Promise<void> {
    const data = {
        protocolo,
        score,
        classificacao,
        calculado_em: new Date(),
        calculado_por: usuarioId,
        updated_at: new Date(),
    };
    const query = trx ? trx("avaliacoes") : db("avaliacoes");
    await query.insert(data).onConflict("protocolo").merge(data);
}

export async function registrarHistorico(item: HistoricoItem, trx?: typeof db): Promise<void> {
    const data = {
        protocolo: item.protocolo,
        score_anterior: item.scoreAnterior,
        classificacao_anterior: item.classificacaoAnterior,
        score_novo: item.scoreNovo,
        classificacao_nova: item.classificacaoNova,
        usuario: item.usuario,
        motivo: item.motivo || null,
        criado_em: new Date(),
    };
    const query = trx ? trx("historico_priorizacao") : db("historico_priorizacao");
    await query.insert(data);
}
