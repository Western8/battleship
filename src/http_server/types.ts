import ws from "ws";

export interface IDB {
  users: Users;
  rooms: IRoom[];
  games: IGame[];
  winners: Winners;
}

export interface Counters {
  users: number;
  rooms: number;
  games: number;
}

export interface wsExt extends ws {
  wsIndex: number;
}

export type WsClients = wsExt[];

export interface IUser {
  id: number;
  name: string;
  password: string;
  isBot: boolean;
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

export interface ICell {
  isShip: boolean;
  ship: IShip | null;
  status: Status;
}

export type CellsY = ICell[];

export type Field = CellsY[];

export interface IGamePlayer {
  idPlayer: number;
  ships: Ships;
  field: Field;
}

export interface IGame {
    idGame: number;
    players: IGamePlayer[];
    turn: number;
    gameOver: boolean;
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

export interface IShipModel {
  type: ShipsTypes,
  size: number,
  count: number,
}

export enum Status {
  Miss = 'miss',
  Killed = 'killed',
  Shot = 'shot',
  None = 'none',
}

export interface IPosition {
  x: number;
  y: number;
}

export interface IShip {
  position: IPosition;
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

export interface IFeedback {
  position: IPosition;
  currentPlayer: number;
  status: Status;
}

export interface ITurnResponse {
  currentPlayer: number;
}

export interface IAttackResult {
  feedbacks: IFeedback[],
  game: IGame,
}

export interface Winner {
  winner: number;
  name: string;
  wins: number;
}

export type Winners = Winner[];

export interface IGameResult {
  winner: number;
  players: number[];
} 
