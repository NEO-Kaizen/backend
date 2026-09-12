export interface CriterioRow {
    criterion_id: string;
    name: string;
    weight: number;
    active: boolean;
}

export interface AvaliacaoRow {
    protocolo: string;
    score: number;
    classificacao: Classificacao;
    calculado_em: string;
    calculado_por: string;
}

export interface Criterio {
    id: string;
    nome: string;
    peso: number;
    ativo: boolean;
}

export interface NotasInput {
    [criterioId: string] : number;
}

export type Classificacao = "baixa" | "media" | "alta" | "critica";

export interface AvaliacaoResultado {
    protocolo: string;
    score: number;
    classificacao: Classificacao;
    calculado_em: string;
    calculado_por: string;
}

export interface ErroValidacaoCampo {
    criterio: string;
    problema: string;
}

export interface Avaliacao {
    protocolo: string;
    score: number;
    classificacao: Classificacao;
    calculado_em: string;
    calculado_por: string;
}

export interface HistoricoItem {
    protocolo: string;
    scoreAnterior: number;
    classificacaoAnterior: Classificacao;
    scoreNovo: number;
    classificacaoNova: Classificacao;
    usuario: string;
    motivo?: string;
}