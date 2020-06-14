import { CellType, Game, GameState, GMap, Move, MoveType, Player, Resources } from "../model/models";
import * as debug from "debug";

const log = debug('lvg:engine');

export class GameLoop {
    private readonly _tickDuration: number;
    private readonly _game: Game;
    private readonly _engine: RulesEngine;
    private _intervalHandle: NodeJS.Timeout | undefined;
    private _isProcessingTick = false;
    private _inputBuffer: PlayerInputBuffer;

    constructor(tickDuration: number, game: Game, engine: RulesEngine, inputBuffer: PlayerInputBuffer) {
        this._tickDuration = tickDuration;
        this._game = game;
        this._engine = engine;
        this._inputBuffer = inputBuffer;
    }


    play(): void {
        if (this._game.state === GameState.READY_TO_START) {
            this._game.startGame(this._tickDuration);
        } else if (this._game.state === GameState.PAUSED) {
            this._game.setPaused(false);
        }

        if (!this._intervalHandle) {
            this._intervalHandle = setInterval(() => this.performTick(), this._tickDuration);
        }
    }

    pause(): void {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            delete this._intervalHandle;
        }
        if (this._game.state === GameState.RUNNING) {
            this._game.setPaused(true);
        }
    }

    async performTick(): Promise<void> {
        if (this._isProcessingTick) {
            log("Game loop busy, skipping frame.");
            return;
        } else {
            this._isProcessingTick = true;
            const hasGameEnded = await this._engine.onTick(this._game, this._inputBuffer);
            if (hasGameEnded) {
                this.pause();
            }
            this._isProcessingTick = false;
        }
    }
}

export interface RulesEngine {
    onTick(game: Game, inputBuffer: PlayerInputBuffer): Promise<boolean>
}

export class BasicRuleEngine implements RulesEngine {
    private static readonly CAN_PLACE_ON_TOP_OF_OTHERS = false;
    private static readonly CAN_PLACE_ON_TOP_OF_SELF = false;

    async onTick(game: Game, inputBuffer: PlayerInputBuffer): Promise<boolean> {
        //process user actions
        const p1 = game.player1;
        let p1Move: Move | undefined;
        if (p1) {
            p1Move = inputBuffer.popNextMoveByPlayer(p1);
        }

        const p2 = game.player1;
        let p2Move: Move | undefined;
        if (p2) {
            p2Move = inputBuffer.popNextMoveByPlayer(p2);
        }

        if (p1Move && p2Move) {
            if (p1Move.order < p2Move.order) {
                BasicRuleEngine.processPlayerMove(game.map, p1Move, game.player1Resources.cellType)
                    .apply(game.map, game.player1Resources);

                BasicRuleEngine.processPlayerMove(game.map, p2Move, game.player2Resources.cellType)
                    .apply(game.map, game.player2Resources);
            } else {
                BasicRuleEngine.processPlayerMove(game.map, p2Move, game.player2Resources.cellType)
                    .apply(game.map, game.player2Resources);

                BasicRuleEngine.processPlayerMove(game.map, p1Move, game.player1Resources.cellType)
                    .apply(game.map, game.player1Resources);
            }
        } else if (p1Move) {
            BasicRuleEngine.processPlayerMove(game.map, p1Move, game.player1Resources.cellType)
                .apply(game.map, game.player1Resources);
        } else if (p2Move) {
            BasicRuleEngine.processPlayerMove(game.map, p2Move, game.player2Resources.cellType)
                .apply(game.map, game.player2Resources);
        }

        //process game rules
        const gameRulesDiff = BasicRuleEngine.applyGameOfLifeRules(game.map);

        gameRulesDiff.apply(game.map, undefined);

        //tally up player cells
        const p1CellType = game.player1Resources.cellType;
        const p2CellType = game.player2Resources.cellType;

        let p1CellCount = 0;
        let p2CellCount = 0;

        const height = game.map.height;
        for (let y = 0; y < height; ++y) {
            const width = game.map.width;
            for (let x = 0; x < width; ++x) {
                const state = game.map.state;
                const cell = state[y][x];
                if (cell === p1CellType) {
                    p1CellCount += 1;
                } else if (cell === p2CellType) {
                    p2CellCount += 1;
                }
            }
        }

        game.player1Resources.cellsAlive = p1CellCount;
        game.player2Resources.cellsAlive = p2CellCount;

        //decide if the game is over
        let isGameEnd = false;
        if (p1CellCount <= 0 && p2CellCount <= 0) {
            game.endGame(undefined);
            isGameEnd = true;
        } else if (p1CellCount <= 0) {
            game.endGame(p2);
            isGameEnd = true;
        } else if (p2CellCount <= 0) {
            game.endGame(p1);
            isGameEnd = true;
        }

        return Promise.resolve(isGameEnd);
    }

    private static processPlayerMove(map: GMap, move: Move, playerCellType: CellType): Diff {
        if (move.type === MoveType.PLACE_CELL) {
            const x = move.origin.x;
            const y = move.origin.y;
            if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                const cellType = map.state[x][y];
                let placementValid: boolean;
                switch (cellType) {
                    case CellType.OUT_OF_BOUNDS:
                        placementValid = false;
                        break;
                    case CellType.OUT_OF_VISION:
                    case CellType.DEAD:
                        placementValid = true;
                        break;
                    case CellType.NEUTRAL:
                    case CellType.PLAYER_A:
                    case CellType.PLAYER_B:
                    case CellType.PLAYER_C:
                    case CellType.PLAYER_D:
                        if (cellType === playerCellType) {
                            placementValid = this.CAN_PLACE_ON_TOP_OF_SELF;
                        } else {
                            placementValid = this.CAN_PLACE_ON_TOP_OF_OTHERS;
                        }
                        break;
                }

                if (placementValid) {
                    return new SetMapDiff(new ModifyResDiff(undefined, -1, cellType), x, y, cellType);
                } else {
                    return emptyDiff;
                }
            }
        }

        return emptyDiff;
    }

    private static applyGameOfLifeRules(map: GMap): Diff {
        let resultDiff = emptyDiff;
        for (let y = 0; y < map.height; ++y) {
            for (let x = 0; x < map.width; ++x) {
                const me = map.state[y][x];
                let neighbourCount = 0;
                let containsWarringNeighbours = false;

                for (const n of this.neighbours(map, x, y)) {
                    if (this.isLivingCell(n)) {
                        neighbourCount += 1;
                        if (n !== me && n !== CellType.NEUTRAL) {
                            containsWarringNeighbours = true;
                        }
                    }
                }

                if (this.isLivingCell(map.state[y][x]) && (neighbourCount > 3 || neighbourCount < 2)) {
                    resultDiff = new ClearMapDiff(resultDiff, x, y);
                } else if (neighbourCount === 3) {
                    if (containsWarringNeighbours) {
                        resultDiff = new SetMapDiff(resultDiff, x, y, CellType.NEUTRAL);
                    } else {
                        resultDiff = new SetMapDiff(resultDiff, x, y, me);
                    }
                }
            }
        }

        return resultDiff;
    }

    private static getCell(map: GMap, x: number, y: number): CellType {
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
            return map.state[y][x];
        }
        return CellType.OUT_OF_BOUNDS;
    }

    private static* neighbours(map: GMap, x: number, y: number) {
        yield this.getCell(map, x - 1, y - 1);
        yield this.getCell(map, x, y - 1);
        yield this.getCell(map, x + 1, y - 1);
        yield this.getCell(map, x - 1, y);
        yield this.getCell(map, x + 1, y);
        yield this.getCell(map, x - 1, y + 1);
        yield this.getCell(map, x, y + 1);
        yield this.getCell(map, x + 1, y + 1);
    }

    private static isLivingCell(type: CellType): boolean {
        return type === CellType.PLAYER_A
            || type === CellType.PLAYER_B
            || type === CellType.PLAYER_C
            || type === CellType.PLAYER_D
            || type === CellType.NEUTRAL;
    }
}

class Diff {
    private readonly _parent: Diff | undefined;

    constructor(parent: Diff | undefined = undefined) {
        this._parent = parent;
    }

    apply(map: GMap, resource: Resources | undefined): void {
        if (this._parent) {
            this._parent.apply(map, resource);
        }
        this.applyInternal(map, resource);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected applyInternal(map: GMap, resource: Resources | undefined): void {
        /*empty for actual implementations*/
    }
}

const emptyDiff = new Diff();

class SetMapDiff extends Diff {
    private readonly _x: number;
    private readonly _y: number;
    private readonly _type: CellType;


    constructor(parent: Diff | undefined, x: number, y: number, type: CellType) {
        super(parent);
        this._x = x;
        this._y = y;
        this._type = type;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected applyInternal(map: GMap, _: Resources | undefined): void {
        map.state[this._x][this._y] = this._type;
    }
}

class ClearMapDiff extends SetMapDiff {
    constructor(parent: Diff | undefined, x: number, y: number) {
        super(parent, x, y, CellType.DEAD);
    }
}

class ModifyResDiff extends Diff {
    private readonly _modifyAmount: number;
    private readonly _cellType: CellType;


    constructor(parent: Diff | undefined, modifyAmount: number, cellType: CellType) {
        super(parent);
        this._modifyAmount = modifyAmount;
        this._cellType = cellType;
    }

    protected applyInternal(map: GMap, resource: Resources | undefined): void {
        if (resource && resource.cellType === this._cellType) {
            resource.cellsInInventory += this._modifyAmount;
        }
    }
}

export interface PlayerInputBuffer {
    onNewMoveReceived(p: Player, m: Move): void

    popNextMoveByPlayer(p: Player): Move | undefined
}

export class PrioritizingLastInputBuffer implements PlayerInputBuffer {
    private readonly _unprocessedMoves: Map<Player, Move> = new Map<Player, Move>();

    popNextMoveByPlayer(p: Player): Move | undefined {
        const nextMove = this._unprocessedMoves.get(p);
        if (nextMove !== undefined) {
            this._unprocessedMoves.delete(p);
        }

        return nextMove;
    }

    onNewMoveReceived(p: Player, m: Move): void {
        const bufferedMove = this._unprocessedMoves.get(p);

        if (!bufferedMove || bufferedMove.order < m.order) {
            this._unprocessedMoves.set(p, m);
        }
    }

}