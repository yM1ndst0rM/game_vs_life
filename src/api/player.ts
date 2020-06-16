import * as express from "express";
import { gameManager } from "../game/manager";
import { constants as http } from "http2";
import Players from "../dao/players_dao";
import Games from "../dao/games_dao";

const router: express.Router = express.Router();
const bearerRegEx = RegExp("^Bearer (.*)$");

const auth = async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const bearerToken = req.header(http.HTTP2_HEADER_AUTHORIZATION);

        const parsedToken = bearerRegEx.exec(bearerToken ?? "");
        if (!parsedToken || !parsedToken.groups) {
            res.sendStatus(http.HTTP_STATUS_UNAUTHORIZED);
        } else {
            const player = Players.getAuthorizedPlayer(parsedToken.groups["1"]);

            if (!player) {
                res.sendStatus(http.HTTP_STATUS_UNAUTHORIZED);
            } else {
                res.locals.player = player;
                next();
            }
        }
    } catch (e) {
        next(e);
    }
};

router.post("/", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        res.status(http.HTTP_STATUS_CREATED).send(Players.createPlayer());
    } catch (e) {
        next(e);
    }
});

router.put("/name/:name", auth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const player = Players.setPlayerName(res.locals.player.id, req.params.name);
        const outPlayer = {id: player.id, name: player.name};
        res.status(http.HTTP_STATUS_OK).send(outPlayer);
    } catch (e) {
        next(e);
    }
});

router.get("/:playerId(\\d+)", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const player = Players.getPlayer(Number.parseInt(req.params.playerId));

        if (player) {
            res.status(http.HTTP_STATUS_OK).send(player);
        } else {
            res.sendStatus(http.HTTP_STATUS_NOT_FOUND);
        }

    } catch (e) {
        next(e);
    }
});

router.post("/join/game/:gameId(\\d+)", auth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number.parseInt(req.params.gameId);
        const game = Games.getGame(gameId);

        if (game) {
            gameManager.addPlayerToGame(res.locals.player, game);
            res.status(http.HTTP_STATUS_ACCEPTED).send(Games.getGame(gameId));
        } else {
            next(new Error(`Game with Id ${gameId} does not exist, and thus cannot be joined.`));
        }
    } catch (e) {
        next(e);
    }
});

router.post("/:playerId(\\d+)/game/:gameId(\\d+)/leave", auth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number.parseInt(req.params.gameId);
        const game = Games.getGame(gameId);

        if (game) {
            gameManager.removePlayerFromGame(res.locals.player, game);
        }

        res.status(http.HTTP_STATUS_ACCEPTED).send(Games.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

router.put("/:playerId(\\d+)/game/:gameId(\\d+)/move", auth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number.parseInt(req.params.gameId);
        const game = Games.getGame(gameId);

        if (game) {
            gameManager.makeMove(game, res.locals.player, req.body);
            res.status(http.HTTP_STATUS_ACCEPTED).send(Games.getGame(gameId));
        } else {
            next(new Error(`Game with Id ${gameId} does not exist, so no moves can be made.`));
        }

    } catch (e) {
        next(e);
    }
});

export default router;