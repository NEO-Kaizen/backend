import { hash, genSalt, compare } from "bcrypt";
import { HttpError } from "../../errors/httpError.ts";

export async function hashPassword(password: string) {
  try {
    const salt = await genSalt(10);

    const hashedPassword = await hash(password, salt);

    return hashedPassword;
  } catch {
    throw new HttpError("Erro ao gerar hash da senha", 400);
  }
}

export async function comparePassword(password: string, hashedPassword: string) {
  try {
    const match = await compare(password, hashedPassword);

    return match;
  } catch {
    throw new HttpError("Erro ao compara as senhas:", 400);
  }
}
