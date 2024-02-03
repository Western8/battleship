import { INewUser, IRoom, IRoomUser } from "./types";
import { db } from "./utils";

export function addRoom(wsIndex: number): IRoom {
  const newRoom: IRoom = {
    roomId: wsIndex,
    roomUsers: [{
      name: db.users[wsIndex].name,
      index: wsIndex,
    }]
  }

  db.rooms.push(newRoom);

  return newRoom;
}

export function addUserToRoom(wsIndex: number, roomId: number): void {
  const user: IRoomUser = {
    name: db.users[wsIndex].name,
    index: wsIndex,
  }
  db.rooms[roomId].roomUsers.push(user);
}