import type { Request, Response } from "express";
import type { Criterio, Classificacao } from "../../shared/types/priorization.js";
import * as service from "./priorization.service.js";
import { ValidacaoError } from "../priorization/priorization.error.ts";

export const getCriterios = async (req: Request, res: Response) => {
    const criterios: Criterio[] = await service.listarCriterios();
    return res.status(200).json(criterios);
};

export const putScorePriorization = async (req: Request, res: Response) => {
    const { protocol } = req.params;
    const { notas, motivo } = req.body;
    const usuarioId = req.user?.id;

    if (!protocol || typeof protocol !== "string") {
        return res.status(400).json({
            erro: "validacao",
            campos: [{ criterio: "protocol", problema: "protocolo inválido ou ausente na URL" }],
        });
    }

    if (!usuarioId) {
        return res.status(401).json({ erro: "não autenticado" });
    }

    if (!notas || typeof notas !== "object" || Array.isArray(notas)) {
        return res.status(422).json({
            erro: "validacao",
            campos: [{ criterio: "notas", problema: "campo 'notas' é obrigatório" }],
        });
    }

    try {
        const resultado = await service.avaliarPriorizacao(protocol, notas, usuarioId, motivo);
        return res.status(200).json(resultado);
    } catch (err) {
        if (err instanceof ValidacaoError) {
            return res.status(422).json({ erro: "validacao", campos: err.campos });
        }

        console.error("[putScorePriorization] erro inesperado:", err);
        return res.status(500).json({ erro: "erro interno no servidor" });
    }
};