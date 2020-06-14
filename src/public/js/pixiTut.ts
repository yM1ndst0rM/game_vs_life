import * as PIXI from 'pixi.js'
import * as getState from './rest'

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas";
}

let rectWidth: number,
    rectHeight: number;

let lastState: number;
lastState = 0;

PIXI.utils.sayHello(type);

const pixiOpt = {
  width: 512, // default: 800
  height: 512, // default: 600
  antialias: true, // default: false
  transparent: false, // default: fals
  resolution: 1, // default: 1
  //forceCanvas: true,
};


const id = 0;

const server = `localhost:8082/game/${id}`;

let state: Array<Array<number>>;

const app = new PIXI.Application(pixiOpt);
app.renderer.autoDensity = true;
//app.renderer.resize(1024, 1024);
app.renderer.backgroundColor = 0x061639;

app.renderer.resize(window.innerWidth - 100, window.innerHeight - 120);

const colorPalette = new Map([
  [0, 0x25262C],
  [1, 0x94B0DA],
  [2, 0x0a81ff],
  [3, 0x303636],
  [4, 0x1BB691],
  [5, 0xB61B3F],
  [6, 0x921BB6],
  [7, 0xB6921B]
]);

function getReq() {
  const myRequest = new Request(server);
  fetch(myRequest)
    .then(renderDeezShit);
}
const geometries = new PIXI.Graphics();

// const connection: undefined;

// connection.onmessage = renderDeezShit;

const renderDeezShit = (inPut: any) => {
  
  inPut.bla._dfsgfg
  if (!lastState <= inPut._state) {
    return;
  }

  lastState = inPut._state;
  rectWidth = inPut._map.width;
  rectHeight = inPut._map.height;
  state = inPut._map.state;


  try {
    let i, j;
    for (i = 0; i < state.length; ++i) {
      for (j = 0; j < state[i].length; ++j) {
        geometries
        .beginFill(colorPalette.get(state[i][j]))
        .drawRect(
          0 + (rectWidth * j),
          0 + (rectHeight * i),
          rectWidth, rectHeight)
          .endFill();
        // .drawRect(inPut[i][j] * 100, inPut[i][j] * 100, width, height);
      }
    }
  } finally {
    app.stage.addChild(geometries);
  }
}

document.body.appendChild(app.view);

window.setInterval(getReq, 1000);