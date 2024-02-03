import { IGame, INewUser, IRoom, IRoomUser } from "./types";
import { db } from "./utils";

export function addGame(wsIndex: number): IGame {
  const game: IGame = {
    idGame: wsIndex,
    idPlayer: wsIndex,
  }

  db.games.push(game);

  return game;
}
