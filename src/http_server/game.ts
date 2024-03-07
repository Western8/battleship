import { CellsY, Field, IAttackResult, IFeedback, IGame, IGamePlayer, IGameResult, IPosition, IShip, IShipModel, Players, Ships, ShipsTypes, Status } from "./types";
import { counters, db, random } from "./utils";

export function addGame(players: Players): IGame {
  const gamePlayers = players.map(item => {
    return {
      idPlayer: item,
      ships: [],
      field: [],
    }
  })

  const randomPlayer = random(0, 1);

  counters.games++;
  const game: IGame = {
    idGame: counters.games,
    players: gamePlayers,
    turn: players[randomPlayer],
    gameOver: false,
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
    createField(game);
    return game;
  }
  return undefined;
}

export function checkStartGame(game: IGame): boolean {
  const MAX_SHIPS = 10;
  const playersNotReady: IGamePlayer[] = game.players.filter(item => item.ships.length !== MAX_SHIPS);
  return (playersNotReady.length === 0)
}

function createField(game: IGame) {
  game.players.forEach(itemPlayer => {
    itemPlayer.field = [];
    for (let x = 0; x < 10; x++) {
      const cellsY: CellsY = [];
      for (let y = 0; y < 10; y++) {
        cellsY.push({
          isShip: false,
          ship: null,
          status: Status.None,
        });
      }
      itemPlayer.field.push(cellsY);
    }

    itemPlayer.ships.forEach(itemShip => {
      for (let i = 0; i < itemShip.length; i++) {
        let x = itemShip.position.x;
        let y = itemShip.position.y;
        if (itemShip.direction) {
          y += i;
        } else {
          x += i;
        }
        itemPlayer.field[x][y] = {
          isShip: true,
          ship: itemShip,
          status: Status.None,
        }
      }
    })
  })
}

export function attack(idGame: number, wsIndex: number, x?: number, y?: number): IAttackResult | undefined {
  const feedbacks: IFeedback[] = [];

  const game = db.games.find(item => item.idGame === idGame);
  if (!game) return undefined;
  if (game.turn !== wsIndex) return undefined;
  const player = game.players.find(item => item.idPlayer !== wsIndex);
  if (!player) return undefined;

  if ((x === undefined) || (y === undefined)) {
    const randomCell: IPosition = getRandomCell(player.field);
    x = randomCell.x;
    y = randomCell.y;
  }

  let status = Status.None
  if (player.field[x][y].isShip) {
    status = Status.Shot;
    player.field[x][y].status = status;
    const ship = player.field[x][y].ship;

    if (ship) {
      let isKilled = true;
      for (let i = 0; i < ship.length; i++) {
        let shipX = ship.position.x;
        let shipY = ship.position.y;
        if (ship.direction) {
          shipY += i;
        } else {
          shipX += i;
        }
        if (player.field[shipX][shipY].status === Status.None) {
          isKilled = false;
        }
      }
      if (isKilled) {
        status = Status.Killed;

        for (let i = 0; i < ship.length; i++) {
          let shipX = ship.position.x;
          let shipY = ship.position.y;
          if (ship.direction) {
            shipY += i;
          } else {
            shipX += i;
          }
          player.field[shipX][shipY].status = Status.Killed;
          let feedback = {
            position: { x: shipX, y: shipY },
            currentPlayer: wsIndex,
            status,
          }
          feedbacks.push(feedback);
          const surrounds = addMissSurround(player.field, shipX, shipY);
          surrounds.forEach(item => {
            feedbacks.push({
              position: { x: item.x, y: item.y },
              currentPlayer: wsIndex,
              status: Status.Miss,
            })
          })
        }

      }
    }
  } else {
    status = Status.Miss;
  }
  player.field[x][y].status = status;

  const feedback = {
    position: { x, y },
    currentPlayer: wsIndex,
    status,
  };
  feedbacks.push(feedback);

  if (status === Status.Miss) {
    game.turn = player.idPlayer;
  }

  const attackResult = {
    feedbacks,
    game,
  }

  return attackResult;
}

function addMissSurround(field: Field, x: number, y: number): IPosition[] {
  const surrounds = [];
  for (let i = -1; i < 2; i++) {
    for (let k = -1; k < 2; k++) {
      if ((i === 0) && (k === 0)) {
        continue;
      }
      const newX = x + i;
      const newY = y + k;
      if ((newX < 0) || (newX > 9) || (newY < 0) || (newY > 9)) continue;
      if (!field[newX][newY].isShip) {
        field[newX][newY].status = Status.Miss;
        surrounds.push({
          x: newX,
          y: newY,
        });
      }
    }
  }
  return surrounds;
}

export function checkFinish(game: IGame): number | undefined {
  let winner: number | undefined = undefined;
  game.players.forEach(itemPlayer => {
    const cellsKilled = itemPlayer.field.map(itemCellsY => {
      return itemCellsY.filter(itemCell => itemCell.status === Status.Killed);
    }).flat();
    if (cellsKilled.length >= 20) {
      winner = game.players.find(itemPlayerWinner => itemPlayerWinner.idPlayer !== itemPlayer.idPlayer)?.idPlayer;
    }
  })

  if (winner) {
    const winnerFind = db.winners.find(item => item.winner === winner);
    if (winnerFind) {
      winnerFind.wins++;
    } else {
      const userWinner = db.users.find(item => item.id === winner);
      if (userWinner) {
        db.winners.push({
          winner,
          name: userWinner.name,
          wins: 1,
        })
      }
    }
    game.gameOver = true;
  }

  return winner;
}

function getCellsNone(field: Field) {
  const cells = field.map((itemCellsY, indexX) => {
    return itemCellsY.map((itemCell, indexY) => {
      return {
        x: indexX,
        y: indexY,
        status: itemCell.status,
      }
    });
  }).flat().filter(item => item.status === Status.None);
  return cells;
}

function getRandomCell(field: Field): IPosition {
  const cells = getCellsNone(field);
  const randomCell = random(0, (cells.length - 1));
  const { x, y } = cells[randomCell];
  return { x, y }
}

export function getRandomShips(): Ships {
  const ships: Ships = [];
  const shipModels: IShipModel[] = [
    { type: ShipsTypes.Huge, size: 4, count: 1 },
    { type: ShipsTypes.Large, size: 3, count: 2 },
    { type: ShipsTypes.Medium, size: 2, count: 3 },
    { type: ShipsTypes.Small, size: 1, count: 4 },
  ];
  shipModels.sort((a, b) => (b.size - a.size));

  const field: Field = [];
  for (let x = 0; x < 10; x++) {
    const cellsY: CellsY = [];
    for (let y = 0; y < 10; y++) {
      cellsY.push({
        isShip: false,
        ship: null,
        status: Status.None,
      });
    }
    field.push(cellsY);
  }

  shipModels.forEach(shipModel => {
    for (let k = 0; k < shipModel.count; k++) {

      let randomCell: IPosition = { x: 0, y: 0 };
      let randomDirection = true;
      let hasPosition = false;
      let counter = 0;
      while (!hasPosition) {
        counter++;
        if (counter > 9999) {
          console.error("Stack overflow: can't find place for ships");
          return ships;
        }
        randomCell = getRandomCell(field);
        randomDirection = Boolean(random(0, 1));

        hasPosition = true;
        for (let i = 0; i < shipModel.size; i++) {
          let shipX = randomCell.x;
          let shipY = randomCell.y;
          if (randomDirection) {
            shipY += i;
          } else {
            shipX += i;
          }
          if ((shipX > 9) || (shipY > 9) || (field[shipX][shipY].status !== Status.None)) {
            hasPosition = false;
            break;
          }
        }
      }

      for (let i = 0; i < shipModel.size; i++) {
        let shipX = randomCell.x;
        let shipY = randomCell.y;
        if (randomDirection) {
          shipY += i;
        } else {
          shipX += i;
        }
        field[shipX][shipY] = {
          isShip: true,
          ship: null,
          status: Status.Shot,
        }
        const surrounds = addMissSurround(field, shipX, shipY);
        surrounds.forEach(item => {
          field[item.x][item.y] = {
            isShip: true,
            ship: null,
            status: Status.Shot,
          }
        });
      }

      const ship: IShip = {
        length: shipModel.size,
        direction: randomDirection,
        position: randomCell,
        type: shipModel.type,
      }
      ships.push(ship);
    }
  });

  return ships;
}

export function deleteGame(wsIndex: number): IGameResult | undefined {
  const game = db.games.find(item => item.players.filter(item2 => item2.idPlayer === wsIndex).length);
  if (!game) return undefined;
  const winner = game.players.find(item => item.idPlayer !== wsIndex)?.idPlayer;
  if (winner) {
    const winnerFind = db.winners.find(item => item.winner === winner);
    if (winnerFind) {
      winnerFind.wins++;
    } else {
      const userWinner = db.users.find(item => item.id === winner);
      if (userWinner) {
        db.winners.push({
          winner,
          name: userWinner.name,
          wins: 1,
        })
      }
    }
    game.gameOver = true;
    const players = game.players.map(item => item.idPlayer);
    return { winner, players };
  } else {
    return undefined;
  }
}