export interface Player {
    id: number,
    name: string,
    secretKey: string
}

export enum CellType {
    OUT_OF_BOUNDS,
    OUT_OF_VISION,
    DEAD,
    NEUTRAL,

    PLAYER_A,
    PLAYER_B,
    PLAYER_C,
    PLAYER_D,
}

export interface Resources {
    cellType: CellType,
    cellsAlive: number,
    cellsInInventory: number,
}

export interface Game {
    id: number,
    tick: number,
    tickDuration: number,
    state: GameState,
    map: Map,
    player1: Player,
    player2: Player,
    player1_resources: Resources
    player2_resources: Resources
}

export enum GameState {
    NEW,
    WAITING_FOR_PLAYERS,
    READY_TO_START,
    RUNNING,
    PAUSED,

    PLAYER1_WIN,
    PLAYER2_WIN,
    DRAW,
}

export interface Map {
    width: number,
    height: number,
    state: Array<Array<CellType>>
}

export enum MoveType {
    PLACE_CELL
}

export interface Move {
    type: MoveType,
    origin: {
        x: number,
        y: number
    }
}
