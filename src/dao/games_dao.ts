import { Game } from "../model/models";
import { Const } from "../game/const";

class Games {
    private readonly _games: Array<Game> = [];

    getGame(gameId: number): Game | undefined {
        if (gameId < 0 || gameId >= this._games.length) {
            return undefined;
        } else {
            return this._games[gameId];
        }
    }

    createGame(): Game {
        const newId = this._games.length;
        const newGame = new Game(newId, Const.MAP_DEFAULTS);
        this._games.push(newGame);

        newGame.reset();

        return newGame;
    }
}

export default new Games();