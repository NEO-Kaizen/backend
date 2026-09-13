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

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail válido.")
  .max(254, "Máximo de 254 caracteres.");

export const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Máximo de 72 bytes.");
