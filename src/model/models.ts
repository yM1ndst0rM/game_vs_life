import { CellType, Const, STARTING_CONF_P1, STARTING_CONF_P2 } from "../game/const";

export const NOT_SET = -1;

export class PlayerWithAuth implements Player{
    readonly id: number;
    name: string;
    readonly secretKey: string;

    constructor(id: number, securityKey: string) {
        this.id = id;
        this.name = `Player ${id}`;
        this.secretKey = securityKey;
    }
}

export interface Player {
    readonly id: number;
    readonly name: string;
}

export class Resources {
    readonly cellType: CellType;
    private _cellsAlive = 0;
    private _cellsInInventory = 0;

    constructor(type: CellType, startResourceCount: number) {
        this.cellType = type;
        this._cellsInInventory = startResourceCount;
    }

    get cellsInInventory(): number {
        return this._cellsInInventory;
    }

    set cellsInInventory(value: number) {
        this._cellsInInventory = value;
    }

    get cellsAlive(): number {
        return this._cellsAlive;
    }

    set cellsAlive(value: number) {
        this._cellsAlive = value;
    }
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
        this._player1_resources = new Resources(PLAYER1_CELL_TYPE, START_RESOURCE_COUNT);
        this._player2_resources = new Resources(PLAYER2_CELL_TYPE, START_RESOURCE_COUNT);
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

    reset(): void {
        if (this.state !== GameState.NEW) {
            this._map = new MapImpl(this._map.width, this._map.height);
            const {START_RESOURCE_COUNT, PLAYER1_CELL_TYPE, PLAYER2_CELL_TYPE} = Const;
            this._player1_resources = new Resources(PLAYER1_CELL_TYPE, START_RESOURCE_COUNT);
            this._player2_resources = new Resources(PLAYER2_CELL_TYPE, START_RESOURCE_COUNT);
        }

        STARTING_CONF_P1.apply(this._map, this.player1Resources);
        STARTING_CONF_P2.apply(this._map, this.player2Resources);

        if (this.player1 && this.player2) {
            this._state = GameState.READY_TO_START;
        } else {
            this._state = GameState.WAITING_FOR_PLAYERS;
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

    setPaused(shouldPause: boolean): void {
        if (this.state === GameState.RUNNING) {
            if (shouldPause) {
                this._state = GameState.PAUSED;
            }
        } else if (this.state === GameState.PAUSED) {
            if (!shouldPause) {
                this._state = GameState.RUNNING;
            }
        } else {
            throw new Error(`Game with Id ${this.id} is in state ${this.state} and cannot be paused or resumed.`);
        }
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
            this.state[i] = Array(this.width).fill(CellType.DEAD);
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

export interface OrderedMove extends Move {
    readonly order: number
}
