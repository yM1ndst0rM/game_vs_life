import { Game, Player } from "../model/models";
import { Const } from "./Const";
import { BasicRuleEngine, GameLoop, PlayerInputBuffer, PrioritizingLastInputBuffer } from "./engine";

class GameManager {
    private readonly _games: Array<Game> = [];
    private readonly _players: Array<Player> = [];
    private readonly _playersInGames: Map<Player, Game> = new Map();
    private readonly _runningGames: Map<Game, GameLoop> = new Map<Game, GameLoop>();
    private readonly _inputBuffer: PlayerInputBuffer = new PrioritizingLastInputBuffer();


    getGame(gameId: number): Game | undefined {
        if (gameId < 0 || gameId >= this._games.length) {
            return undefined;
        } else {
            return this._games[gameId];
        }
    }

    getPlayer(playerId: number): Player | undefined {
        if (playerId < 0 || playerId >= this._players.length) {
            return undefined;
        } else {
            return this._players[playerId];
        }
    }

    createGame(): Game {
        const newId = this._games.length;
        const newGame = new Game(newId, Const.MAP_DEFAULTS);
        this._games.push(newGame);

        return newGame;
    }

    createPlayer(): Player {
        const newId = this._players.length;
        const newPlayer = new Player(newId);
        this._players.push(newPlayer);

        return newPlayer;
    }


    addPlayerToGame(playerId: number, gameId: number): void {
        const player = this.getPlayer(playerId);
        if (player === undefined) {
            throw new Error(`Player Id ${playerId} unknown.`);
        }

        const preExistingGame = this._playersInGames.get(player);
        if (preExistingGame) {
            throw new Error(`Player with Id ${playerId} is currently in a Game (Id: ${preExistingGame.id})`);
        }

        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be joined.`);
        }

        targetGame.addPlayerToFreeSeat(player);
        this._playersInGames.set(player, targetGame);

    }

    removePlayerFromGame(playerId: number, gameId: number): void {
        const player = this.getPlayer(playerId);
        if (player === undefined) {
            throw new Error(`Player Id ${playerId} unknown.`);
        }

        const gameOfPlayer = this._playersInGames.get(player);
        if (gameOfPlayer !== undefined && gameOfPlayer.id === gameId) {
            gameOfPlayer.removePlayer(player);
            this._playersInGames.delete(player);
        }
    }

    startGame(gameId: number): void {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be started.`);
        }

        const gameLoop = new GameLoop(Const.DEFAULT_TICK_DURATION_MS, targetGame, new BasicRuleEngine(), this._inputBuffer);
        this._runningGames.set(targetGame, gameLoop);
        gameLoop.play();
    }

    pauseGame(gameId: number): void {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be paused.`);
        }

        const gameLoop = this._runningGames.get(targetGame);
        if (gameLoop) {
            gameLoop.pause();
        }
    }

    unpauseGame(gameId: number): void {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be unpaused.`);
        }

        const gameLoop = this._runningGames.get(targetGame);
        if (gameLoop) {
            gameLoop.play();
        }
    }
}

export default GameManager;