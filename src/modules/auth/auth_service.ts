import type { User } from "../../types/user.ts";
import bcrypt from 'bcryptjs';
import * as authRepository from './auth_ repository.ts'
import { HttpError } from "../../errors/httpError.ts";


export async function foundUser(user: User) {

    const found = await authRepository.userFind(user);

    if(!found) {
        throw new HttpError("Usuario não encontrado ou senha invalida", 404);
    }

    const isPasswordValid = await bcrypt.compare(user.password, found.password);

    if (!isPasswordValid){
         throw new HttpError("Usuario não encontrado ou senha invalida", 404);
    }

    return "Usuario encontrado";
}