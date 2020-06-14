import * as express from "express";
import GameManager from "./manager";
import { constants as http } from "http2";

const gameManager = new GameManager();

const router: express.Router = express.Router();

router.post("/", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        res.status(http.HTTP_STATUS_CREATED).send(gameManager.createGame());
    } catch (e) {
        next(e);
    }
});

router.post("/:gameId(\\d+)/player/:playerId(\\d+)/leave", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        gameManager.addPlayerToGame(Number(req.params.playerId), gameId);
        res.status(http.HTTP_STATUS_ACCEPTED).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

router.post("/:gameId(\\d+)/player/:playerId(\\d+)/leave", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        gameManager.removePlayerFromGame(Number(req.params.playerId), gameId);
        res.status(http.HTTP_STATUS_ACCEPTED).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

router.get("/:gameId(\\d+)", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        res.status(http.HTTP_STATUS_OK).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});

router.put("/:gameId(\\d+)/player/:playerId(\\d+)/move", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const gameId = Number(req.params.gameId);
        gameManager.makeMove(gameId, Number(req.params.playerId), req.header(http.HTTP2_HEADER_WWW_AUTHENTICATE) ?? "", req.body);
        res.status(http.HTTP_STATUS_ACCEPTED).send(gameManager.getGame(gameId));
    } catch (e) {
        next(e);
    }
});
