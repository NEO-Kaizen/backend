import { z } from "zod";
import { emailSchema, passwordSchema } from "../../shared/validation/fieldSchemas.ts";

const maxPasswordBytes = z
  .string()
  .min(1, "Campo obrigatório.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Máximo de 72 bytes.");

export const loginSchema = z.object({
  email: emailSchema,
  password: maxPasswordBytes,
});

export const changePasswordSchema = z
  .object({
    currentPassword: maxPasswordBytes,
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Campo obrigatório."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não conferem.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["newPassword"],
  });
