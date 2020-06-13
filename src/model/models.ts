import { Const } from "../game/Const";

export const NOT_SET = -1;

export class Player {
    readonly id: number;
    readonly name: string;
    readonly secretKey: string;

    constructor(id: number) {
        this.id = id;
        this.name = `Player ${id}`;
        this.secretKey = this.makeKey(Const.PLAYER_KEY_LENGTH);
    }

    private makeKey(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; ++i) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
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
    readonly cellType: CellType,
    readonly cellsAlive: number,
    readonly cellsInInventory: number,
}

export class Game {
    private readonly _id: number = NOT_SET;
    private _tick = 0;
    private _tickDuration: number = NOT_SET;
    private _state: GameState = GameState.NEW;
    private _map: Map;
    private _player1?: Player;
    private _player2?: Player;
    private _player1_resources: Resources;
    private _player2_resources: Resources;

    constructor(id: number, mapsize: { width: number, height: number }) {
        this._id = id;
        this._map = new MapImpl(mapsize.width, mapsize.height);
        const {START_RESOURCE_COUNT, PLAYER1_CELL_TYPE, PLAYER2_CELL_TYPE} = Const;
        this._player1_resources = {
            cellType: PLAYER1_CELL_TYPE,
            cellsAlive: 0,
            cellsInInventory: START_RESOURCE_COUNT
        };
        this._player2_resources = {
            cellType: PLAYER2_CELL_TYPE,
            cellsAlive: 0,
            cellsInInventory: START_RESOURCE_COUNT
        };
    }


    get id(): number {
        return this._id;
    }

    get tick(): number {
        return this._tick;
    }

    get tickDuration(): number {
        return this._tickDuration;
    }

    get state(): GameState {
        return this._state;
    }

    get map(): Map {
        return this._map;
    }

    get player1(): Player | undefined {
        return this._player1;
    }

    get player2(): Player | undefined {
        return this._player2;
    }

    get player1Resources(): Resources {
        return this._player1_resources;
    }

    get player2Resources(): Resources {
        return this._player2_resources;
    }

    get winner(): Player | undefined {
        if (this.state === GameState.PLAYER1_WIN) {
            return this.player1;
        } else if (this.state === GameState.PLAYER2_WIN) {
            return this.player2;
        } else {
            return undefined;
        }
    }

    addPlayerToFreeSeat(p: Player): void {
        if (this.state !== GameState.WAITING_FOR_PLAYERS) {
            throw Error(`Game with Id ${this.id} is in state ${this.state} and does not accept new players.`);
        }

        if (this.player1 === undefined) {
            this._player1 = p;
        } else if (this.player2 === undefined) {
            this._player2 = p;
        } else {
            throw new Error(`Game with Id ${this.id} is full.`);
        }

        if (this.player1 && this.player2) {
            this._state = GameState.READY_TO_START;
        }
    }

    removePlayer(p: Player): void {
        if (this.player1 === p) {
            this._player1 = undefined;
            if (this.state === GameState.RUNNING) {
                this._state = GameState.PLAYER2_WIN;
            }
        } else if (this.player2 === p) {
            this._player2 = undefined;
            if (this.state === GameState.RUNNING) {
                this._state = GameState.PLAYER1_WIN;
            }
        }
    }

    startGame(tickDuration: number): void {
        if (this.state !== GameState.READY_TO_START) {
            throw new Error(`Game with Id ${this.id} is in state ${this.state} and cannot be started.`);
        }
        this._tickDuration = tickDuration;
        this._state = GameState.RUNNING;
    }

    nextTick(map: Map, resourcesP1: Resources, resourcesP2: Resources): void {
        if (this.state !== GameState.RUNNING) {
            throw new Error(`Game with Id ${this.id} is in state ${this.state} and cannot receive tick events.`);
        }

        this._map = map;
        this._player1_resources = resourcesP1;
        this._player2_resources = resourcesP2;

        this._tick++;
    }

    endGame(winner: Player | undefined): void {
        if (this.player1 === winner) {
            this._state = GameState.PLAYER1_WIN;
        } else if (this.player2 === winner) {
            this._state = GameState.PLAYER2_WIN;
        } else {
            this._state = GameState.DRAW;
        }
    }
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
    readonly width: number,
    readonly height: number,
    readonly state: Array<Array<CellType>>
}

export class MapImpl implements Map {
    readonly width: number;
    readonly height: number;
    readonly state: Array<Array<CellType>>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.state = Array(this.height);

        for (let i = 0; i < this.state.length; ++i) {
            this.state[i] = Array(this.width);
        }
    }

}

export enum MoveType {
    PLACE_CELL
}

export interface Move {
    readonly type: MoveType,
    readonly origin: {
        readonly x: number,
        readonly y: number
    }
}
