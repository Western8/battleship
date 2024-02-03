import { INewUser, IUser } from "./types";
import { db } from "./utils";

export function addUser(user: IUser): INewUser {
  db.users.push(user);

  console.log('db 11111111 ', db);
  

  const newUser: INewUser = {
    index: (db.users.length - 1),
    name: user.name,
    error: false,
    errorText: '',
  }

  return newUser;
}