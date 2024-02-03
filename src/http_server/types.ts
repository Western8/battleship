import ws from "ws";

export interface wsExt extends ws {
  wsIndex: number;
}

export interface IUser {
  id: number;
  name: string;
  password: string;
}

export interface INewUser {
  index: number;
  name: string;
  error: boolean;
  errorText: string;
}

export type Users = IUser[];

export interface IRoomUser {
  name: string;
  index: number;
}

export interface IRoom {
  roomId: number;
  roomUsers: IRoomUser[];
}

export interface IGame {
    idGame: number;
    idPlayer: number;
}

export interface IDB {
  users: Users;
  rooms: IRoom[];
  games: IGame[];
}