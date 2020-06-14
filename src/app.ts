import * as express from "express";
import * as logger from "morgan";
import * as cookieParser from "cookie-parser";
import * as path from "path";

import gameRouter from "./api/game";
import playerRouter from "./api/player";

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/game", gameRouter);
app.use("/player", playerRouter);

app.get('/', (req, res) => res.send('Hello Game vs. Life!'));

export default app;