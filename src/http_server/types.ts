import ws from "ws";

export interface wsExt extends ws {
  wsIndex: number;
}

export type WsClients = wsExt[];

export interface IUser {
  id: number;
  name: string;
  password: string;
}

export interface IUserResponse {
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

export interface IGamePlayer {
  idPlayer: number;
  ships: Ships;
}

export interface IGame {
    idGame: number;
    players: IGamePlayer[];
}

export interface IGameResponse {
  idGame: number;
  idPlayer: number;
}

export interface IStartGameResponse {
  ships: Ships;
  currentPlayerIndex: number;
}

export type Players = number[];

export enum ShipsTypes {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: ShipsTypes;
}

export type Ships = IShip[];

export interface IShipResponse {
  gameId: number;
  ships: Ships;
  indexPlayer: number;
}

export interface IDB {
  users: Users;
  rooms: IRoom[];
  games: IGame[];
}

export interface Counters {
  users: number;
  rooms: number;
  games: number;
}
