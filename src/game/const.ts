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