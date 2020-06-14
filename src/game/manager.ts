import { Game, Move, Player } from "../model/models";
import { Const } from "./const";
import { BasicRuleEngine, GameLoop, PlayerInputBuffer, PrioritizingLastInputBuffer } from "./engine";

class GameManager {
    private readonly _games: Array<Game> = [];
    private readonly _players: Array<Player> = [];
    private readonly _playersInGames: Map<Player, Game> = new Map();
    private readonly _runningGames: Map<Game, GameLoop> = new Map<Game, GameLoop>();
    private readonly _inputBuffers: Map<Game, PlayerInputBuffer> = new Map<Game, PlayerInputBuffer>();
    private _nextMoveOrderNumber = 0;


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

    setPlayerName(playerId: number, name: string): Player {
        const player = this.getPlayer(playerId);
        if (player === undefined) {
            throw new Error(`Player Id ${playerId} unknown. Cannot find player to set name to ${name}`);
        }

        player.name = name;
        return player;
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

    startGame(gameId: number): Game {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be started.`);
        }

        const inputBuffer = new PrioritizingLastInputBuffer();
        const gameLoop = new GameLoop(Const.DEFAULT_TICK_DURATION_MS, targetGame, new BasicRuleEngine(), inputBuffer);
        this._runningGames.set(targetGame, gameLoop);
        this._inputBuffers.set(targetGame, inputBuffer);
        gameLoop.play();

        return targetGame;
    }

    pauseGame(gameId: number): Game {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be paused.`);
        }

        const gameLoop = this._runningGames.get(targetGame);
        if (gameLoop) {
            gameLoop.pause();
        }

        return targetGame;
    }

    unpauseGame(gameId: number): Game {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus cannot be unpaused.`);
        }

        const gameLoop = this._runningGames.get(targetGame);
        if (gameLoop) {
            gameLoop.play();
        }

        return targetGame;
    }

    makeMove(gameId: number, playerId: number, playerKey: string, move: Move): void {
        const targetGame = this.getGame(gameId);
        if (!targetGame) {
            throw new Error(`Game with Id ${gameId} does not exist, and thus no moves can be performed for it.`);
        }

        const player = this.getPlayer(playerId);
        if (player === undefined) {
            throw new Error(`Player Id ${playerId} unknown.`);
        } else if (player.secretKey !== playerKey) {
            throw new Error(`Player authentication failed.`);
        }

        const input = this._inputBuffers.get(targetGame);
        if (!input) {
            throw new Error(`No player move input stream associated with game ${gameId}. Maybe the game hasn't started?`);
        }

        input.onNewMoveReceived(player, {
            ...move,
            order: this._nextMoveOrderNumber++
        });
    }
}

export default GameManager;