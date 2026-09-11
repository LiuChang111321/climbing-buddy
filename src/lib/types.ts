import type { BadgeDef } from './badges';

export type { BadgeDef };

export type Gym = {
  id: number;
  name: string;
  createdAt: string;
};

export type BookingRow = {
  id: number;
  date: string;
  time: string;
  gymId: number;
  gymName: string;
  climberId: string;
  nickname: string;
  avatar: string;
  badge?: BadgeDef;
};

export type Identity = {
  id: string;
  nickname: string;
  avatar: string;
  signature?: string;
  secret: string;
};

export type BookingInput = {
  date: string;
  time: string;
  gymId: number;
};
