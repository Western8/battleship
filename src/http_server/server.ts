import ws, { WebSocketServer } from "ws";
import { addBot, addUser, deleteUser } from "./users";
import { addRoom, addUserToRoom } from "./room";
import { counters, db } from "./utils";
import { IAttackResult, IGame, IGameResponse, IStartGameResponse, ITurnResponse, Players, Ships, WsClients, wsExt } from "./types";
import { addGame, addShip, attack, checkFinish, checkStartGame, getRandomShips } from "./game";
//import { httpServer } from "./index";
const wsList = [];
const wsClients: WsClients = [];

export const wsServer = new WebSocketServer({
  //httpServer,
  port: 3000,
})

wsServer.on('connection', (wsClient: wsExt) => {
  console.log('wsServer.clients: ', wsServer.clients.size);

  counters.users++;
  wsClient.wsIndex = counters.users;
  wsClients.push(wsClient);

  wsClient.on('message', (message: string) => {
    console.log('message data', JSON.parse(message));

    const request = JSON.parse(message);

    switch (request.type) {
      case 'reg':
        const userResponse = addUser(JSON.parse(request.data), wsClient.wsIndex);
        const response = {
          type: 'reg',
          data: JSON.stringify(userResponse),
          id: 0
        }
        wsClient.send(JSON.stringify(response));
        sendUpdateWinners();
        break;

      case 'create_room':
        addRoom(wsClient.wsIndex);
        sendUpdateRooms();
        break;

      case 'add_user_to_room':
        const indexRoom = JSON.parse(request.data).indexRoom;
        const players: Players = addUserToRoom(wsClient.wsIndex, indexRoom);
        sendUpdateRooms();

        const game: IGame = addGame(players);
        sendCreateGame(game);
        break;

      case 'single_play':
        singlePlay(wsClient.wsIndex);
        break;

      case 'add_ships':
        const data = JSON.parse(request.data);
        const idGame = data.gameId;
        const ships = data.ships;
        const indexPlayer = data.indexPlayer;
        const gameStart = addShip(idGame, indexPlayer, ships);
        if (gameStart) {
          sendStartGame(gameStart);
          checkBot(data.gameId, data.indexPlayer);
        }
        break;

      case 'attack': {
        const data = JSON.parse(request.data);
        const attackResult = attack(data.gameId, data.indexPlayer, data.x, data.y);
        if (attackResult) {
          sendAttackResult(attackResult);
          checkBot(data.gameId, data.indexPlayer);
        };
        break;
      }

      case 'randomAttack': {
        const data = JSON.parse(request.data);
        const attackResult = attack(data.gameId, data.indexPlayer);
        if (attackResult) {
          sendAttackResult(attackResult);
          checkBot(data.gameId, data.indexPlayer);
        };
        break;
      }
    }
  })

  wsServer.on('error', console.error);

  wsServer.on('close', () => {
    console.log('DELETE USER     wsClent.wsIndex ', wsClient.wsIndex);

    deleteUser(wsClient.wsIndex);
  });

});

function sendUpdateRooms(): void {
  const responseRooms = {
    type: 'update_room',
    data: JSON.stringify(db.rooms),
    id: 0
  }
  wsServer.clients.forEach(item => {
    item.send(JSON.stringify(responseRooms));
  })
}

function sendUpdateWinners(): void {
  const response = {
    type: 'update_winners',
    data: JSON.stringify(db.winners),
    id: 0
  }
  wsServer.clients.forEach(item => {
    item.send(JSON.stringify(response));
  })
}


function sendCreateGame(game: IGame): void {
  game.players.forEach(itemPlayer => {
    const gameResponse: IGameResponse = {
      idGame: game.idGame,
      idPlayer: itemPlayer.idPlayer,
    }
    const response = {
      type: 'create_game',
      data: JSON.stringify(gameResponse),
      id: 0
    }

    wsServer.clients.forEach(itemWsClient => {
      const wsClientFind = wsClients.find(item => item.wsIndex === itemPlayer.idPlayer);
      if (itemWsClient === wsClientFind) {
        itemWsClient.send(JSON.stringify(response));
      }
    })
  });
}

function sendStartGame(gameStart: IGame): void {
  gameStart.players.forEach(itemPlayer => {
    const gameResponse: IStartGameResponse = {
      ships: itemPlayer.ships,
      currentPlayerIndex: itemPlayer.idPlayer,
    }
    const response = {
      type: 'start_game',
      data: JSON.stringify(gameResponse),
      id: 0
    }
    const turnResponse: ITurnResponse = {
      currentPlayer: gameStart.turn
    };
    const responseTurn = {
      type: 'turn',
      data: JSON.stringify(turnResponse),
      id: 0
    }

    wsServer.clients.forEach(itemWsClient => {
      const wsClientFind = wsClients.find(item => item.wsIndex === itemPlayer.idPlayer);
      if (itemWsClient === wsClientFind) {
        itemWsClient.send(JSON.stringify(response));
        itemWsClient.send(JSON.stringify(responseTurn));
      }
    })
  });
}


function sendAttackResult(attackResult: IAttackResult): void {
  const players = attackResult.game.players.map(item => item.idPlayer);

  attackResult.feedbacks.forEach(itemFeedback => {
    const response = {
      type: 'attack',
      data: JSON.stringify(itemFeedback),
      id: 0
    }

    wsServer.clients.forEach(itemWsClient => {
      const wsClientFilter = wsClients.filter(item => players.includes(item.wsIndex));
      wsClientFilter.forEach(itemWsClientFilter => {
        if (itemWsClient === itemWsClientFilter) {
          itemWsClient.send(JSON.stringify(response));
        }
      })
      /*  
            const wsClientFind = wsClients.find(item => item.wsIndex === itemFeedback.currentPlayer);
            if (itemWsClient === wsClientFind) {
              itemWsClient.send(JSON.stringify(response));
            }
            */
    })
  });

  const turnResponse: ITurnResponse = {
    currentPlayer: attackResult.game.turn
  };
  const response = {
    type: 'turn',
    data: JSON.stringify(turnResponse),
    id: 0
  }
  wsServer.clients.forEach(itemWsClient => {
    const wsClientFilter = wsClients.filter(item => players.includes(item.wsIndex));
    wsClientFilter.forEach(itemWsClientFilter => {
      if (itemWsClient === itemWsClientFilter) {
        itemWsClient.send(JSON.stringify(response));
      }
    })
  });

  const winner = checkFinish(attackResult.game);
  if (winner) {
    const response = {
      type: 'finish',
      data: JSON.stringify({ winPlayer: winner }),
      id: 0
    }
    wsServer.clients.forEach(itemWsClient => {
      const wsClientFilter = wsClients.filter(item => players.includes(item.wsIndex));
      wsClientFilter.forEach(itemWsClientFilter => {
        if (itemWsClient === itemWsClientFilter) {
          itemWsClient.send(JSON.stringify(response));
        }
      })
    });

    sendUpdateWinners();
  }
}

function singlePlay(wsIndex: number) {
  const botFind = db.users.find(item => item.isBot);
  let indexBot = -1;
  if (botFind) {
    indexBot = botFind.id;
  } else {
    indexBot = addBot();
  }
  const players: Players = [wsIndex, indexBot];
  const game: IGame = addGame(players);
  sendCreateGame(game);

  const ships: Ships = getRandomShips();
  const gameStart = addShip(game.idGame, indexBot, ships);
  if (gameStart) {
    sendStartGame(gameStart);
  }
}

function checkBot(idGame: number, wsIndex: number) {
  const game = db.games.find(item => item.idGame === idGame);
  if (!game) return undefined;
  if (game.turn === wsIndex) return undefined;
  const player = game.players.find(item => item.idPlayer !== wsIndex);
  if (!player) return undefined;
  const bot = db.users.find(item => ((item.id === player.idPlayer) && item.isBot));
  if (!bot) return undefined;

  let counter = 0;
  while (game.turn === player.idPlayer && counter < 999 && !game.gameOver) {
    counter++;
    const attackResult = attack(idGame, player.idPlayer);
    if (attackResult) {
      sendAttackResult(attackResult);
    };
  }
}