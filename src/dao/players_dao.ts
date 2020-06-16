import { Player, PlayerWithAuth } from "../model/models";

class Players {
    private readonly PLAYER_KEY_LENGTH = 10;

    private readonly _players: Array<PlayerWithAuth> = [];

    getPlayer(playerId: number): Player | undefined {
        const p = this.getPlayerObj(playerId);
        if (p) {
            return Players.deleteSensitiveInfo(p);
        }

        return undefined;
    }

    private getPlayerObj(playerId: number): PlayerWithAuth | undefined {
        if (playerId < 0 || playerId >= this._players.length) {
            return undefined;
        } else {
            return this._players[playerId];
        }
    }

    createPlayer(): PlayerWithAuth {
        const newId = this._players.length;
        const newPlayer = new PlayerWithAuth(newId, Players.bearerTokenFrom(newId, Players.makeRandString(this.PLAYER_KEY_LENGTH)));
        this._players.push(newPlayer);

        return newPlayer;
    }

    setPlayerName(playerId: number, name: string): Player {
        const player = this.getPlayerObj(playerId);
        if (player === undefined) {
            throw new Error(`Player Id ${playerId} unknown. Cannot find player to set name to ${name}`);
        }

        player.name = name;
        return Players.deleteSensitiveInfo(player);
    }

    private static makeRandString(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; ++i) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    private static deleteSensitiveInfo(p: PlayerWithAuth): Player {
        // secretKey is only used to delete the prop form the player obj
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {secretKey, ...safeP} = p;
        return safeP;
    }

    private static bearerTokenFrom(id: number, securityKey: string): string {
        return `${id}/${securityKey}`;
    }

    private static readonly INVALID_TOKEN = -1;
    private static readonly tokenRegEx = RegExp("^(\\d+)\\/(.*)$");

    private static getIdFromBearerToken(token: string): number {
        const parsedKey = this.tokenRegEx.exec(token);
        if (!parsedKey || !parsedKey.groups) {
            return this.INVALID_TOKEN;
        }

        return Number(parsedKey.groups["1"]);
    }
}

export default new Players();