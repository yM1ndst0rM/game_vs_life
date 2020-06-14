import * as express from "express";
import * as logger from "morgan";
import * as cookieParser from "cookie-parser";
import * as path from "path";

const app = express()

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public/')));

app.get('/', (req, res) => res.send('Hello World!'))

export default app;