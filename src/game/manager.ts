import { Game, Move, Player } from "../model/models";
import { Const } from "./const";
import { BasicRuleEngine, GameLoop, PlayerInputBuffer, PrioritizingLastInputBuffer } from "./engine";

class GameManager {

    private readonly _playersInGames: Map<Player, Game> = new Map();
    private readonly _runningGames: Map<Game, GameLoop> = new Map<Game, GameLoop>();
    private readonly _inputBuffers: Map<Game, PlayerInputBuffer> = new Map<Game, PlayerInputBuffer>();
    private _nextMoveOrderNumber = 0;

    //TODO fix reference equals comparisons
    addPlayerToGame(player: Player, game: Game): void {
        const preExistingGame = this._playersInGames.get(player);
        if (preExistingGame) {
            throw new Error(`Player with Id ${player.id} is currently in a Game (Id: ${preExistingGame.id})`);
        }

        game.addPlayerToFreeSeat(player);
        this._playersInGames.set(player, game);

    }

    removePlayerFromGame(player: Player, game: Game): void {
        const gameOfPlayer = this._playersInGames.get(player);

        if (gameOfPlayer !== undefined && gameOfPlayer.id === game.id) {
            gameOfPlayer.removePlayer(player);
            this._playersInGames.delete(player);
        }
    }

    startGame(targetGame: Game): void {
        const inputBuffer = new PrioritizingLastInputBuffer();
        const gameLoop = new GameLoop(Const.DEFAULT_TICK_DURATION_MS, targetGame, new BasicRuleEngine(), inputBuffer);
        this._runningGames.set(targetGame, gameLoop);
        this._inputBuffers.set(targetGame, inputBuffer);
        gameLoop.play();
    }

    pauseGame(targetGame: Game) {
        const gameLoop = this._runningGames.get(targetGame);
        if (gameLoop) {
            gameLoop.pause();
        }
    }

    unpauseGame(targetGame: Game): void {
        const gameLoop = this._runningGames.get(targetGame);
        if (gameLoop) {
            gameLoop.play();
        }
    }

    makeMove(targetGame: Game, player: Player, move: Move): void {
        const input = this._inputBuffers.get(targetGame);
        const playerGame = this._playersInGames.get(player);

        if (playerGame !== targetGame || (targetGame.player1 !== player && targetGame.player2 !== player)) {
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