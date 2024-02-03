import ws, { WebSocketServer } from "ws";
import { addUser } from "./users";
import { addRoom, addUserToRoom } from "./room";
import { db } from "./utils";
import { IGame, wsExt } from "./types";
import { addGame } from "./game";
//import { httpServer } from "./index";
const wsList = [];

export const wsServer = new WebSocketServer({
  //httpServer,
  port: 3000,
})

wsServer.on('connection', (wsClient: wsExt) => {

  console.log('1111111 New client!!');
  console.log('wsServer.clients ', wsServer.clients.size);

  wsClient.wsIndex = db.users.length;

  wsClient.on('message', (message: string) => {
    console.log('message data', JSON.parse(message));
    console.log('wsClient.wsIndex ', wsClient.wsIndex);

    const request = JSON.parse(message);

    switch (request.type) {
      case 'reg':
        const newUser = addUser(JSON.parse(request.data));
        const response = {
          type: 'reg',
          data: JSON.stringify(newUser),
          id: 0
        }
        wsClient.send(JSON.stringify(response));
        break;

      case 'create_room':
        addRoom(wsClient.wsIndex);
        sendUpdateRooms();
        break;

      case 'add_user_to_room':
        const indexRoom = JSON.parse(request.data).indexRoom;
        addUserToRoom(wsClient.wsIndex, indexRoom);
        sendUpdateRooms();

        const game: IGame = addGame(wsClient.wsIndex);
        const responseGame = {
          type: 'create_game',
          data: JSON.stringify(game),
          id: 0
        }
        wsServer.clients.forEach(item => {
          item.send(JSON.stringify(responseGame));
        })

        break;
    }



  })

  wsServer.on('error', console.error);

});


wsServer.on('message', (data) => {
  console.log('message data1111', data);
})

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