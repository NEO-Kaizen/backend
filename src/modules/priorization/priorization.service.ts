import type { Criterio, AvaliacaoResultado, NotasInput, ErroValidacaoCampo, Classificacao } from "../../shared/types/priorization.ts";
import * as repo from "./priorization.repository.ts";
import { ValidacaoError } from "../priorization/priorization.error.ts";
import { AppError } from "../../shared/errors/AppError.ts";

export const listarCriterios = async () : Promise<Criterio[]> => {
    return await repo.getCriteriosAtivos();
}

export const avaliarPriorizacao = async (
    protocolo: string,
    notas: NotasInput,
    usuarioId: string,
    motivo?: string
): Promise<AvaliacaoResultado> => {
    const criterios = await repo.getCriteriosAtivos();

    const erros = validarNotas(notas, criterios);
    if (erros.length > 0) {
        throw new ValidacaoError(erros);
    }

    const score = calcularScore(notas, criterios);
    const classificacao = classificar(score);

    await repo.runTransaction(async (trx) => {
        const anterior = await repo.getAvaliacaoAtual(protocolo, trx);

        await repo.salvarNotas(protocolo, notas, criterios, trx);
        await repo.upsertAvaliacao(protocolo, score, classificacao, usuarioId, trx);

        if (anterior) {
            await repo.registrarHistorico(
                {
                    protocolo,
                    scoreAnterior: anterior.score,
                    classificacaoAnterior: anterior.classificacao,
                    scoreNovo: score,
                    classificacaoNova: classificacao,
                    usuario: usuarioId,
                    motivo,
                },
                trx
            );
        }
    });

    return {
        protocolo,
        score,
        classificacao,
        calculado_em: new Date().toISOString(),
        calculado_por: usuarioId,
    };
};

export function classificar(score: number): Classificacao {
    const scoreArredondado = Number(score.toFixed(1)); 

    if (scoreArredondado <= 20.0) return "baixa";
    if (scoreArredondado <= 30.0) return "media";
    if (scoreArredondado <= 40.0) return "alta";
    return "critica";
}


const validarNotas = (notas: NotasInput, criterios: Criterio[]) : ErroValidacaoCampo[] => {

    const erros: ErroValidacaoCampo[] = [];
    const idsValidos = new Set(criterios.map((c) => c.id));

    for(const criterio of criterios){
        const nota = notas[criterio.id];

        if(nota === undefined || nota === null){
            erros.push({
                criterio: criterio.id,
                problema: "Nota é obrigatória",
            });
            continue;
        }

        if(!notaEhValida(nota)) {
            erros.push({
                criterio: criterio.id,
                problema: "Nota deve ser um numero inteiro entre 1 e 5",
            })
        }

        for(const chave of Object.keys(notas)) {
            if(!idsValidos.has(chave)){
                erros.push({
                    criterio: chave,
                    problema: "Critério inválido"
                })
            }
        }
    }

    return erros;
}

const calcularScore = (notas: NotasInput, criterios: Criterio[]): number => {
  if (!notas) {
    throw new AppError("notas vazias", 400);
  }

  const somaPonderada = criterios.reduce((acc, c) => {
    const nota = notas[c.id];
    if (nota === undefined) {
      throw new AppError(`nota do critério '${c.id}' não informada`, 400);
    }
    return acc + nota * c.peso;
  }, 0);

  const somaPesos = criterios.reduce((acc, c) => acc + c.peso, 0);

  return Number(((somaPonderada / somaPesos) * 10).toFixed(1));
}

const notaEhValida = (nota: number) : boolean => {

    if(nota >=1 && nota <= 5) return true;

    return false;
}