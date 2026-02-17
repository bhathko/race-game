import { Application } from "pixi.js";
import { CANVAS, COLORS } from "./config";
import { Game } from "./core";

async function init() {
  const app = new Application();

  await app.init({
    width: CANVAS.WIDTH,
    height: CANVAS.HEIGHT,
    backgroundColor: COLORS.BACKGROUND,
    resizeTo: window,
  });

  document.getElementById("app")?.appendChild(app.canvas);

  const game = new Game(app);
  await game.start();
}

init();
