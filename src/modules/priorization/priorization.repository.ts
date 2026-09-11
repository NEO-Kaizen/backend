//import db from "../../database/conection.ts";
import type { Criterio } from "../../shared/types/priorization.ts";

export const CRITERIOS_MOCK: Criterio[] = [
  { id: "impacto_operacional",     nome: "Impacto operacional",     peso: 10, ativo: true },
  { id: "risco_operacional",       nome: "Risco operacional",       peso: 10, ativo: true },
  { id: "urgencia",                nome: "Urgência",                peso: 10, ativo: true },
  { id: "volumetria",              nome: "Volumetria",              peso: 10, ativo: true },
  { id: "esforco_manual",          nome: "Esforço manual",          peso: 10, ativo: true },
  { id: "impacto_cliente",         nome: "Impacto no cliente",      peso: 10, ativo: true },
  { id: "prazo_regulatorio",       nome: "Prazo regulatório",       peso: 10, ativo: true },
  { id: "areas_impactadas",        nome: "Áreas impactadas",        peso: 10, ativo: true },
  { id: "alinhamento_estrategico", nome: "Alinhamento estratégico", peso: 10, ativo: true },
  { id: "complexidade_estimada",   nome: "Complexidade estimada",   peso: 10, ativo: true },
];


export async function getCriteriosAtivos(): Promise<Criterio[]> {
    return await CRITERIOS_MOCK.filter((c) => c.ativo);
}

