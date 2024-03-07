import { deleteGame } from "./game";
import { deleteRoom } from "./room";
import { IGameResult, IUser, IUserResponse } from "./types";
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
    isBot: false,
  });

  const userResponse: IUserResponse = {
    index: wsIndex,
    name: dataUser.name,
    error: false,
    errorText: '',
  }

  return userResponse;
}

export function addBot(): number {
  counters.users++;
  const indexBot = counters.users;
  db.users.push({
    id: indexBot,
    name: 'Bot',
    password: '',
    isBot: true,
  });
  return indexBot;
}

export function deleteUser(wsIndex: number): IGameResult | undefined {
  deleteRoom(wsIndex);
  const gameResult = deleteGame(wsIndex);
  db.users = db.users.filter(item => item.id !== wsIndex);
  return gameResult;
}