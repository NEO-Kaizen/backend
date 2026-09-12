import { z } from "zod";

const ptNumber = (n: number) => n.toLocaleString("pt-BR");

export const requiredString = (maxChars: number) =>
  z
    .string()
    .trim()
    .min(1, "Campo obrigatório.")
    .max(maxChars, `Máximo de ${ptNumber(maxChars)} caracteres.`);

export const optionalString = (maxChars: number) =>
  z
    .string()
    .trim()
    .max(maxChars, `Máximo de ${ptNumber(maxChars)} caracteres.`)
    .transform((value) => (value === "" ? undefined : value))
    .optional();
