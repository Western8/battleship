import { WebSocketServer } from "ws";
import { addBot, addUser, deleteUser } from "./users";
import { addRoom, addUserToRoom } from "./room";
import { counters, db } from "./utils";
import { IAttackResult, IGame, IGamePlayer, IGameResponse, IGameResult, IStartGameResponse, ITurnResponse, Players, Ships, WsClients, wsExt } from "./types";
import { addGame, addShip, attack, checkFinish, getRandomShips } from "./game";
const wsClients: WsClients = [];

export const wsServer = new WebSocketServer({
  port: 3000,
})

if (wsServer) {
  console.log(`WS-Server starts on port ${wsServer.options.port}`);
}

wsServer.on('connection', (wsClient: wsExt) => {
  console.log('New websocket connection. WS-Server clients: ', wsServer.clients.size);

  counters.users++;
  wsClient.wsIndex = counters.users;
  wsClients.push(wsClient);

  wsClient.on('message', (message: string) => {
    console.log('Received command: ', JSON.parse(message));

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
        console.log('Response: ', response);
        sendUpdateRooms();
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

  wsClient.on('close', () => {
    console.log(`Websocket for client id ${wsClient.wsIndex} closed`);
    const gameResult: IGameResult | undefined = deleteUser(wsClient.wsIndex);
    if (gameResult) {
      sendFinishGame(gameResult.winner, gameResult.players);
      sendUpdateWinners();
    };
    sendUpdateRooms();
  });

  wsServer.on('error', console.error);
});

process.on('exit', () => {
  wsServer.clients.forEach(itemWsClient => {
    itemWsClient.close();
  });
  wsServer.close();
  console.log('Websocket server closed');
});

process.on('SIGINT', () => process.exit());

function sendUpdateRooms(): void {
  const response = {
    type: 'update_room',
    data: JSON.stringify(db.rooms),
    id: 0
  }
  wsServer.clients.forEach(item => {
    item.send(JSON.stringify(response));
  });
  console.log('Response: ', response);
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
  console.log('Response: ', response);
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
    });
    console.log('Response: ', response);
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
    });
    console.log('Response: ', response);
    console.log('Response: ', responseTurn);
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
    });
    console.log('Response: ', response);
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
  console.log('Response: ', response);

  const winner = checkFinish(attackResult.game);
  if (winner) {
    sendFinishGame(winner, players);
    sendUpdateWinners();
  }
}

function sendFinishGame(winner: number, players: number[]): void {
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
  console.log('Response: ', response);
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