import { Game, GameState, Map as GMap, Move, MoveType, OrderedMove, Player } from "../model/models";
import * as debug from "debug";
import { CellType } from "./const";
import { ClearCellDiff, Diff, emptyDiff, ModifyResDiff, PutCellDiff } from "./diff";

const log = debug('lvg:engine');

export class GameLoop {
    private readonly _tickDuration: number;
    private readonly _game: Game;
    private readonly _engine: RulesEngine;
    private readonly _inputBuffer: PlayerInputBuffer;
    private _intervalHandle: NodeJS.Timeout | undefined;
    private _isProcessingTick = false;

    constructor(tickDuration: number, game: Game, engine: RulesEngine, inputBuffer: PlayerInputBuffer) {
        this._tickDuration = tickDuration;
        this._game = game;
        this._engine = engine;
        this._inputBuffer = inputBuffer;
    }


    play(): void {
        if (this._game.state === GameState.PAUSED) {
            this._game.setPaused(false);
        } else {
            this._game.startGame(this._tickDuration);
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

    private async performTick(): Promise<void> {
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
        let p1Move: OrderedMove | undefined;
        if (p1) {
            p1Move = inputBuffer.popNextMoveByPlayer(p1);
        }

        const p2 = game.player2;
        let p2Move: OrderedMove | undefined;
        if (p2) {
            p2Move = inputBuffer.popNextMoveByPlayer(p2);
        }

        const m = game.map;
        if (p1Move && p2Move) {
            if (p1Move.order < p2Move.order) {
                BasicRuleEngine.processPlayerMove(m, p1Move, game.player1Resources.cellType)
                    .apply(m, game.player1Resources);

                BasicRuleEngine.processPlayerMove(m, p2Move, game.player2Resources.cellType)
                    .apply(m, game.player2Resources);
            } else {
                BasicRuleEngine.processPlayerMove(m, p2Move, game.player2Resources.cellType)
                    .apply(m, game.player2Resources);

                BasicRuleEngine.processPlayerMove(m, p1Move, game.player1Resources.cellType)
                    .apply(m, game.player1Resources);
            }
        } else if (p1Move) {
            BasicRuleEngine.processPlayerMove(m, p1Move, game.player1Resources.cellType)
                .apply(m, game.player1Resources);
        } else if (p2Move) {
            BasicRuleEngine.processPlayerMove(m, p2Move, game.player2Resources.cellType)
                .apply(m, game.player2Resources);
        }

        //process game rules
        const gameRulesDiff = BasicRuleEngine.applyGameOfLifeRules(m);

        gameRulesDiff.apply(m, undefined);

        //tally up player cells
        const p1CellType = game.player1Resources.cellType;
        const p2CellType = game.player2Resources.cellType;

        let p1CellCount = 0;
        let p2CellCount = 0;

        const height = m.height;
        for (let y = 0; y < height; ++y) {
            const width = m.width;
            for (let x = 0; x < width; ++x) {
                const cell = m.get(x, y);
                if (cell === p1CellType) {
                    p1CellCount += 1;
                } else if (cell === p2CellType) {
                    p2CellCount += 1;
                }
            }
        }

        game.player1Resources.cellsAlive = p1CellCount;
        game.player2Resources.cellsAlive = p2CellCount;

        game.nextTick(m, game.player1Resources, game.player2Resources);

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
                const cellType = map.get(x, y);
                let placementValid = false;
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
                    return new PutCellDiff(x, y, playerCellType).plus(new ModifyResDiff(-1, playerCellType));
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
                const me = map.get(x, y);
                let neighbourCount = 0;
                let containsWarringNeighbours = false;
                let playerNeighbourFirstType: CellType | undefined = undefined;
                if (this.isPlayerCell(me)) {
                    playerNeighbourFirstType = me;
                }

                for (const n of this.neighbours(map, x, y)) {
                    if (this.isLivingCell(n)) {
                        neighbourCount += 1;
                        if (this.isPlayerCell(n)) {
                            if (playerNeighbourFirstType && n !== playerNeighbourFirstType) {
                                containsWarringNeighbours = true;
                            } else {
                                playerNeighbourFirstType = n;
                            }
                        }
                    }
                }

                if (this.isLivingCell(map.get(x, y)) && (neighbourCount > 3 || neighbourCount < 2)) {
                    resultDiff = resultDiff.plus(new ClearCellDiff(x, y));
                } else if (neighbourCount === 3) {
                    if (containsWarringNeighbours || !playerNeighbourFirstType) {
                        resultDiff = resultDiff.plus(new PutCellDiff(x, y, CellType.NEUTRAL));
                    } else {
                        resultDiff = resultDiff.plus(new PutCellDiff(x, y, playerNeighbourFirstType));
                    }
                }
            }
        }

        return resultDiff;
    }


    private static* neighbours(map: GMap, x: number, y: number) {
        yield map.potentiallyUnsafeGet(x - 1, y - 1);
        yield map.potentiallyUnsafeGet(x, y - 1);
        yield map.potentiallyUnsafeGet(x + 1, y - 1);
        yield map.potentiallyUnsafeGet(x - 1, y);
        yield map.potentiallyUnsafeGet(x + 1, y);
        yield map.potentiallyUnsafeGet(x - 1, y + 1);
        yield map.potentiallyUnsafeGet(x, y + 1);
        yield map.potentiallyUnsafeGet(x + 1, y + 1);
    }

    private static isLivingCell(type: CellType): boolean {
        return this.isPlayerCell(type)
            || type === CellType.NEUTRAL;
    }

    private static isPlayerCell(type: CellType): boolean {
        return type === CellType.PLAYER_A
            || type === CellType.PLAYER_B
            || type === CellType.PLAYER_C
            || type === CellType.PLAYER_D;
    }
}

export interface PlayerInputBuffer {
    onNewMoveReceived(p: Player, m: OrderedMove): void

    popNextMoveByPlayer(p: Player): OrderedMove | undefined
}

export class PrioritizingLastInputBuffer implements PlayerInputBuffer {
    private readonly _unprocessedMoves: Map<number, OrderedMove> = new Map<number, OrderedMove>();

    popNextMoveByPlayer(p: Player): OrderedMove | undefined {
        const nextMove = this._unprocessedMoves.get(p.id);
        if (nextMove !== undefined) {
            this._unprocessedMoves.delete(p.id);
        }

        return nextMove;
    }

    onNewMoveReceived(p: Player, m: OrderedMove): void {
        const bufferedMove = this._unprocessedMoves.get(p.id);

        if (!bufferedMove || bufferedMove.order < m.order) {
            this._unprocessedMoves.set(p.id, m);
        }
    }

}