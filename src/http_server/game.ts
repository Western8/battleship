import { IGame, IGamePlayer, IRoom, IRoomUser, IShip, Players, Ships } from "./types";
import { counters, db } from "./utils";

export function addGame(players: Players): IGame {
  const gamePlayers = players.map(item => {
    return {
      idPlayer: item,
      ships: [],
    }
  })

  counters.games++;
  const game: IGame = {
    idGame: counters.games,
    players: gamePlayers,
  }
  db.games.push(game);

  return game;
}

//export function addShip(game: IGame, wsIndex: number, ships: Ships): void {
export function addShip(idGame: number, wsIndex: number, ships: Ships): IGame | undefined {
  const game = db.games.find(item => item.idGame === idGame);
  if (!game) return undefined;
  const player = game.players.find(item => item.idPlayer === wsIndex);
  if (player) {
    ships.forEach(ship => player.ships.push(ship));
  }

  if (checkStartGame(game)) {
    return game;
  }
  return undefined;
}

export function checkStartGame(game: IGame): boolean {
  const MAX_SHIPS = 10;
  const playersNotReady: IGamePlayer[] = game.players.filter(item => item.ships.length !== MAX_SHIPS);
  return (playersNotReady.length === 0)
}