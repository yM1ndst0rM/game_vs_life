import { Game, Move, Player } from "../model/models";
import { Const } from "./const";
import { BasicRuleEngine, GameLoop, PlayerInputBuffer, PrioritizingLastInputBuffer } from "./engine";

class GameManager {

    private readonly _playersInGames: Map<number, Game> = new Map();
    private readonly _runningGames: Map<number, GameLoop> = new Map<number, GameLoop>();
    private readonly _inputBuffers: Map<number, PlayerInputBuffer> = new Map<number, PlayerInputBuffer>();
    private _nextMoveOrderNumber = 0;

    addPlayerToGame(player: Player, game: Game): void {
        const preExistingGame = this._playersInGames.get(player.id);
        if (preExistingGame) {
            throw new Error(`Player with Id ${player.id} is currently in a Game (Id: ${preExistingGame.id})`);
        }

        game.addPlayerToFreeSeat(player);
        this._playersInGames.set(player.id, game);

    }

    removePlayerFromGame(player: Player, game: Game): void {
        const gameOfPlayer = this._playersInGames.get(player.id);

        if (gameOfPlayer !== undefined && gameOfPlayer.id === game.id) {
            gameOfPlayer.removePlayer(player);
            this._playersInGames.delete(player.id);
        }
    }

    startGame(targetGame: Game): void {
        const inputBuffer = new PrioritizingLastInputBuffer();
        const gameLoop = new GameLoop(Const.DEFAULT_TICK_DURATION_MS, targetGame, new BasicRuleEngine(), inputBuffer);
        this._runningGames.set(targetGame.id, gameLoop);
        this._inputBuffers.set(targetGame.id, inputBuffer);
        gameLoop.play();
    }

    pauseGame(targetGame: Game) {
        const gameLoop = this._runningGames.get(targetGame.id);
        if (gameLoop) {
            gameLoop.pause();
        }
    }

    unpauseGame(targetGame: Game): void {
        const gameLoop = this._runningGames.get(targetGame.id);
        if (gameLoop) {
            gameLoop.play();
        }
    }

    makeMove(targetGame: Game, player: Player, move: Move): void {
        const input = this._inputBuffers.get(targetGame.id);
        const playerGame = this._playersInGames.get(player.id);

        if (playerGame?.id !== targetGame.id || (targetGame?.player1?.id !== player.id && targetGame?.player2?.id !== player.id)) {
            throw new Error(`Player (Id:${player.id}) is not in game (Id:${targetGame.id}). Join the game to be able to perform moves.`);
        }
        if (!input) {
            throw new Error(`No player move input stream associated with game ${targetGame.id}. Maybe the game hasn't started?`);
        }

        input.onNewMoveReceived(player, {
            ...move,
            order: this._nextMoveOrderNumber++
        });
    }
}

export const gameManager = new GameManager();