import { Game, GameState } from "../model/models";

export class GameLoop {
    private readonly _tickDuration: number;
    private readonly _game: Game;
    private readonly _engine: RulesEngine;

    constructor(tickDuration: number, game: Game, engine: RulesEngine) {
        this._tickDuration = tickDuration;
        this._game = game;
        this._engine = engine;
    }


    play(): void {
        if (this._game.state === GameState.READY_TO_START) {
            this._game.startGame(this._tickDuration);
        } else if (this._game.state === GameState.PAUSED) {
            this._game.setPaused(false);
        }

        //TODO make game loop tick
    }

    pause(): void {
        //TODO pause ticks
        if (this._game.state === GameState.RUNNING) {
            this._game.setPaused(true);
        }
    }
}

export interface RulesEngine {
    onTick(game: Game): void
}