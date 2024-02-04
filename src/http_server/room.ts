import { IRoom, IRoomUser, Players } from "./types";
import { counters, db } from "./utils";

export function addRoom(wsIndex: number): void {
  const user = db.users.find(item => item.id === wsIndex);
  if (!user) return;
  counters.rooms++;
  const newRoom: IRoom = {
    roomId: counters.rooms,
    roomUsers: [{
      name: user.name,// db.users[wsIndex].name,
      index: wsIndex,
    }]
  }

  db.rooms.push(newRoom);
}

export function addUserToRoom(wsIndex: number, roomId: number): Players {
  const user = db.users.find(item => item.id === wsIndex);
  if (!user) return [];
  const roomUser: IRoomUser = {
    name: user.name,
    index: wsIndex,
  }
  const room = db.rooms.find(item => item.roomId === roomId);
  if (!room) return [];
  if (!room.roomUsers.filter(item => item.index !== wsIndex).length) return [];
  room.roomUsers.push(roomUser);

  const players: Players = room.roomUsers.map(item => item.index);

  deleteRoom(wsIndex);

  return players;
}

export function deleteRoom(wsIndex: number): void {
  db.rooms = db.rooms.filter(item => {
    const myRooms = item.roomUsers.filter(item2 => item2.index === wsIndex);
    return !myRooms.length
  });
}