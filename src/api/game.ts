import * as express from "express";
import { gameManager } from "../game/manager";
import { constants as http } from "http2";
import Games from "../dao/games_dao";
import { Game } from "../model/models";

const router: express.Router = express.Router();

router.post("/", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        res.status(http.HTTP_STATUS_CREATED).send(Games.createGame());
    } catch (e) {
        next(e);
    }
});

router.all("/:gameId(\\d+)", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const game = Games.getGame(Number.parseInt(req.params.gameId));
        if (game) {
            res.locals.game = game;
        } else {
            res.sendStatus(http.HTTP_STATUS_NOT_FOUND);
        }
    } catch (e) {
        next(e);
    }
});


router.get("/:gameId(\\d+)", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        res.status(http.HTTP_STATUS_OK).send(res.locals.game);
    } catch (e) {
        next(e);
    }
});

router.post("/:gameId(\\d+)/start", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const targetGame: Game = res.locals.game;
        gameManager.startGame(targetGame);
        res.status(http.HTTP_STATUS_OK).send(Games.getGame(targetGame.id));
    } catch (e) {
        next(e);
    }
});

router.post("/:gameId(\\d+)/pause", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const targetGame: Game = res.locals.game;
        gameManager.pauseGame(targetGame);

        res.status(http.HTTP_STATUS_OK).send(Games.getGame(targetGame.id));
    } catch (e) {
        next(e);
    }
});

router.post("/:gameId(\\d+)/resume", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const targetGame: Game = res.locals.game;
        gameManager.unpauseGame(targetGame);

        res.status(http.HTTP_STATUS_OK).send(Games.getGame(targetGame.id));
    } catch (e) {
        next(e);
    }
});


export default router;