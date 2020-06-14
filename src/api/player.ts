import * as express from "express";
import GameManager from "../game/manager";
import { constants as http } from "http2";

const gameManager = new GameManager();

const router: express.Router = express.Router();

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
        res.status(http.HTTP_STATUS_CREATED).send(outPlayer);
    } catch (e) {
        next(e);
    }
});

router.get("/:playerId(\\d+)", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const playerId = Number(req.params.playerId);
        const player = gameManager.getPlayer(playerId);

        if (!player) {
            res.sendStatus(http.HTTP_STATUS_NOT_FOUND);
        } else {
            const outPlayer = {id: player.id, name: player.name};

            res.status(http.HTTP_STATUS_OK).send(outPlayer);
        }

    } catch (e) {
        next(e);
    }
});

export default router;