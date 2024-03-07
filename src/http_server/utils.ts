import { Counters, IDB } from "./types";

export const db: IDB = {
  users: [],
  rooms: [],
  games: [],
  winners: [],
}

export const counters: Counters = {
  users: 0,
  rooms: 0,
  games: 0,
}

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
} 
