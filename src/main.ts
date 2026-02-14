import { Application } from 'pixi.js';
import { CONFIG } from './config';
import { Game } from './core/Game';

async function init() {
  const app = new Application();
  
  await app.init({
    width: CONFIG.CANVAS_WIDTH,
    height: CONFIG.CANVAS_HEIGHT,
    backgroundColor: 0x1a1a1a,
    resizeTo: window
  });

  document.getElementById('app')?.appendChild(app.canvas);

  const game = new Game(app);
  await game.start();
}

init();
