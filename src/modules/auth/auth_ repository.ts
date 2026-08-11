import { hashPassword } from "../../shared/utils/passwordHandler.ts";
import type { User } from "../../types/user.ts";

//an object created solely to simulate the use of a database in the code
const db = [
  {
    email: "2",
    password: await hashPassword("22"),
  },
];

export async function userFind(user: User) {
  const userExist = await db.find((u: User) => u.email === user.email);

  return userExist;
}
