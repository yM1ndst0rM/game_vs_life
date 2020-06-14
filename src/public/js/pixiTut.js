"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PIXI = require("pixi.js");
let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas";
}
PIXI.utils.sayHello(type);
const pixiOpt = {
    width: 512,
    height: 512,
    antialias: true,
    transparent: false,
    resolution: 1,
};
const app = new PIXI.Application(pixiOpt);
//app.renderer.autoResize = true;
//app.renderer.resize(1024, 1024);
app.renderer.backgroundColor = 0x061639;
//let pic = PIXI.utils.TextureCache["../images/external-content.duckduckgo.com.jpeg"];
PIXI.Loader.shared.add("../../images/external-content.duckduckgo.com.jpeg").load(setup);
function setup() {
    const sprite = new PIXI.Sprite(PIXI.Loader.shared.resources["../../images/external-content.duckduckgo.com.jpeg"].texture);
}
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.resize(window.innerWidth - 100, window.innerHeight - 120);
document.body.appendChild(app.view);
//# sourceMappingURL=pixiTut.js.map