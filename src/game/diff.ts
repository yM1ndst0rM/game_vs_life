import { CellType } from "./const";
import { Map as GMap, Resources } from "../model/models";

export class Diff {
    protected _parent: Diff | undefined;

    constructor(parent: Diff | undefined = undefined) {
        this._parent = parent;
    }

    apply(map: GMap, resource: Resources | undefined): void {
        if (this._parent) {
            this._parent.apply(map, resource);
        }
        this.applyInternal(map, resource);
    }

    plus(diff: Diff): Diff {
        diff._parent = this;

        return diff;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected applyInternal(map: GMap, resource: Resources | undefined): void {
        /*empty for actual implementations*/
    }
}

export const emptyDiff = new Diff();

export class PutCellDiff extends Diff {
    private readonly _x: number;
    private readonly _y: number;
    private readonly _type: CellType;


    constructor(x: number, y: number, type: CellType, parent: Diff | undefined = undefined) {
        super(parent);
        this._x = x;
        this._y = y;
        this._type = type;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected applyInternal(map: GMap, _: Resources | undefined): void {
        map.state[this._x][this._y] = this._type;
    }
}

export class ClearCellDiff extends PutCellDiff {
    constructor(x: number, y: number, parent: Diff | undefined = undefined) {
        super(x, y, CellType.DEAD, parent);
    }
}

export class ModifyResDiff extends Diff {
    private readonly _modifyAmount: number;
    private readonly _cellType: CellType;


    constructor(modifyAmount: number, cellType: CellType, parent: Diff | undefined) {
        super(parent);
        this._modifyAmount = modifyAmount;
        this._cellType = cellType;
    }

    protected applyInternal(map: GMap, resource: Resources | undefined): void {
        if (resource && resource.cellType === this._cellType) {
            resource.cellsInInventory += this._modifyAmount;
        }
    }
}