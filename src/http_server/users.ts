import { deleteRoom } from "./room";
import { IUser, IUserResponse } from "./types";
import { counters, db } from "./utils";

export function addUser(dataUser: IUser, wsIndex: number): IUserResponse {

  const userFind = db.users.find(item => item.name === dataUser.name);
  if (userFind !== undefined) {
    const userResponse: IUserResponse = {
      index: wsIndex, 
      name: dataUser.name,
      error: true,
      errorText: `Error! User with name "${dataUser.name}" already exists!`,
    }
    return userResponse;
  }

  db.users.push({
    id: wsIndex,
    name: dataUser.name,
    password: dataUser.password,
  });

  const userResponse: IUserResponse = {
    index: wsIndex,
    name: dataUser.name,
    error: false,
    errorText: '',
  }

  return userResponse;
}

export function deleteUser(wsIndex: number): void {
  deleteRoom(wsIndex);
  db.users = db.users.filter(item => item.id !== wsIndex);
}