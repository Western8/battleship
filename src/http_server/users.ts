import { deleteRoom } from "./room";
import { IUser, IUserResponse } from "./types";
import { counters, db } from "./utils";

export function addUser(dataUser: IUser, wsIndex: number): IUserResponse {
  db.users.push({
    id: wsIndex,
    name: dataUser.name,
    password: dataUser.password,
  });

  const userResponse: IUserResponse = {
    index: wsIndex, //(db.users.length - 1),
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