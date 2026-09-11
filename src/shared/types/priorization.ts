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