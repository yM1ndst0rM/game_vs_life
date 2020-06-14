import * as express from "express";
import { gameManager } from "../game/manager";
import { constants as http } from "http2";

const router: express.Router = express.Router();
const bearerRegEx = RegExp("Bearer .*");

router.all("/:playerId(\\d+)/.*", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const bearerToken = req.header(http.HTTP2_HEADER_AUTHORIZATION);

        if (!bearerToken || bearerRegEx.test(bearerToken)) {
            res.sendStatus(http.HTTP_STATUS_UNAUTHORIZED);
        } else {
            const playerId = Number(req.params.playerId);
            const player = gameManager.getPlayer(playerId);

            if (!player) {
                res.sendStatus(http.HTTP_STATUS_NOT_FOUND);
            } else {
                if (bearerToken?.substr(7) !== player.secretKey) {
                    res.sendStatus(http.HTTP_STATUS_UNAUTHORIZED);
                } else {
                    next();
                }
            }
        }
    } catch (e) {
        next(e);
    }
});

router.post("/", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        res.status(http.HTTP_STATUS_CREATED).send(gameManager.createPlayer());
    } catch (e) {
        next(e);
    }
});

router.put("/:playerId(\\d+)/name/:name", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const player = gameManager.setPlayerName(Number(req.params.playerId), req.params.name);
        const outPlayer = {id: player.id, name: player.name};
        res.status(http.HTTP_STATUS_OK).send(outPlayer);
    } catch (e) {
        next(e);
    }
});

router.get("/:playerId(\\d+)", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const playerId = Number(req.params.playerId);
        const player = gameManager.getPlayer(playerId);

        if (player) {
            const outPlayer = {id: player.id, name: player.name};

            res.status(http.HTTP_STATUS_OK).send(outPlayer);
        } else {
            res.sendStatus(http.HTTP_STATUS_NOT_FOUND);
        }

    } catch (e) {
        next(e);
    }
});

router.post("/:playerId(\\d+)/game/:gameId(\\d+)/join", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        gameManager.addPlayerToGame(Number(req.params.playerId), gameId);
        res.status(http.HTTP_STATUS_ACCEPTED).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

router.post("/:playerId(\\d+)/game/:gameId(\\d+)/leave", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        gameManager.removePlayerFromGame(Number(req.params.playerId), gameId);
        res.status(http.HTTP_STATUS_ACCEPTED).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

router.put("/:playerId(\\d+)/game/:gameId(\\d+)/move", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        gameManager.makeMove(gameId, Number(req.params.playerId), req.header(http.HTTP2_HEADER_WWW_AUTHENTICATE) ?? "", req.body);
        res.status(http.HTTP_STATUS_ACCEPTED).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

export default router;