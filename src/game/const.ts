import { PutCellDiff } from "./diff";

export enum CellType {
    OUT_OF_BOUNDS,
    OUT_OF_VISION,
    DEAD,
    NEUTRAL,

    PLAYER_A,
    PLAYER_B,
    PLAYER_C,
    PLAYER_D,
}


export const Const = {
    START_RESOURCE_COUNT: 100,
    PLAYER1_CELL_TYPE: CellType.PLAYER_A,
    PLAYER2_CELL_TYPE: CellType.PLAYER_B,
    MAP_DEFAULTS: {
        width: 60,
        height: 60
    },
    PLAYER_KEY_LENGTH: 10,
    DEFAULT_TICK_DURATION_MS: 1000
};

export const STARTING_CONF_P1 =
    new PutCellDiff( 4, 4, Const.PLAYER1_CELL_TYPE)
    .plus(new PutCellDiff(4, 5, Const.PLAYER1_CELL_TYPE))
    .plus(new PutCellDiff(5, 4, Const.PLAYER1_CELL_TYPE))
    .plus(new PutCellDiff(5, 5, Const.PLAYER1_CELL_TYPE))
    .plus(new PutCellDiff(8, 5, Const.PLAYER1_CELL_TYPE))
    .plus(new PutCellDiff(9, 5, Const.PLAYER1_CELL_TYPE))
    .plus(new PutCellDiff(10, 5, Const.PLAYER1_CELL_TYPE));

const w = Const.MAP_DEFAULTS.width;
const h = Const.MAP_DEFAULTS.height;
export const STARTING_CONF_P2 =
    new PutCellDiff(w - 4, h - 4, Const.PLAYER1_CELL_TYPE)
        .plus(new PutCellDiff(w - 4, h - 5, Const.PLAYER1_CELL_TYPE))
        .plus(new PutCellDiff(w - 5, h - 4, Const.PLAYER1_CELL_TYPE))
        .plus(new PutCellDiff(w - 5, h - 5, Const.PLAYER1_CELL_TYPE))
        .plus(new PutCellDiff(w - 8, h - 5, Const.PLAYER1_CELL_TYPE))
        .plus(new PutCellDiff(w - 9, h - 5, Const.PLAYER1_CELL_TYPE))
        .plus(new PutCellDiff(w - 10, h - 5, Const.PLAYER1_CELL_TYPE));
