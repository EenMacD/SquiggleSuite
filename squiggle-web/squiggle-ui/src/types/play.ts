import type { BallPassEvent } from './game'

export interface Position {
  x: number;
  y: number;
}

export interface BallState {
  position: Position;
  attachedTo: {
    type: 'attacking' | 'defensive';
    id: number;
  } | null;
}

export interface PlayerState {
  playerId: string;
  position: Position;
  // Optional relative coordinates within the field (0-1)
  relativePosition?: Position;
  timestamp: number;
  ballState?: BallState;
}

export interface Play {
  id: string;
  name: string;
  createdAt: string;
  playerStates: PlayerState[];
  ballEvents: BallPassEvent[];
}

export interface CreatePlayRequest {
  name: string;
  playerStates: PlayerState[];
  ballEvents: BallPassEvent[];
}
