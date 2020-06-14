import * as PIXI from "pixi.js"

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas";
}

let rectWidth: number,
    rectHeight: number;


PIXI.utils.sayHello(type);

const pixiOpt = {
  width: 512, // default: 800
  height: 512, // default: 600
  antialias: true, // default: false
  transparent: false, // default: fals
  resolution: 1, // default: 1
  //forceCanvas: true,
};


const app = new PIXI.Application(pixiOpt);
app.renderer.autoDensity = true;
//app.renderer.resize(1024, 1024);
app.renderer.backgroundColor = 0x061639;

app.renderer.resize(window.innerWidth - 100, window.innerHeight - 120);

// const Loader = PIXI.Loader,
//       resources = PIXI.LoaderResource,
//       Sprite = PIXI.Sprite;

// const colorIter = [
//   [0, 0x25262C],
//   [1, 0x94B0DA],
//   [2, 0x0a81ff],
//   [3, 0x303636],
//   [4, 0x1BB691],
//   [5, 0xB61B3F],
//   [6, 0x921BB6],
//   [7, 0xB6921B]
// ];

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


//define mapwidth or RECT-width/height ???
function initializing(content) {
  rectWidth = content.width;
  rectHeight = content.height;
}

const geometries = new PIXI.Graphics();

const connection: undefined;

connection.onmessage = handleMessage;

function handleMessage(msg) {
  switch (msg.type) {
    case 'init':
      initializing(msg.cntnt);
    break;

    case 'refresh':
      renderDeezShit(msg.cntnt)
    break;

    default:
      console.log('crack');
    break;
  }
}

const renderDeezShit = async (inPut) => {

  if (!inPut) {
    const inPut = [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 2],
    ];
  }
  try {
    let i, j;
    for (i = 0; i < inPut.length; ++i) {
      for (j = 0; j < inPut[i].length; ++j) {
        geometries
        .beginFill(colorPalette.get(inPut[i][j]))
        .drawRect(
          0 + (rectWidth * j),
          0 + (rectHeight * i),
          rectWidth, rectHeight)
          .endFill();
        // .drawRect(inPut[i][j] * 100, inPut[i][j] * 100, width, height);
      }
    }
  } finally {
    return geometries;
  }
}

app.stage.addChild(geometries);

document.body.appendChild(app.view);