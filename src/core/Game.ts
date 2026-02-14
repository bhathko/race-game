import { Application, Container, Ticker, Assets, Texture, Rectangle } from "pixi.js";
import { RaceScene } from "../scenes/RaceScene";
import { MenuScene } from "../scenes/MenuScene";
import { ResultScene } from "../scenes/ResultScene";
import { Racer } from "../entities/Racer";
import type { RacerAnimations } from "../entities/Racer";
import { CONFIG } from "../config";

export class Game {
  private app: Application;
  private currentScene: Container | null = null;
  private updateFn: ((ticker: Ticker) => void) | null = null;
  private bearAnimations: RacerAnimations | null = null;
  private treeAnimation: Texture[] = [];

  constructor(app: Application) {
    this.app = app;
    window.addEventListener("resize", () => this.onResize());
  }

  private onResize() {
    if (this.currentScene && (this.currentScene as any).resize) {
      (this.currentScene as any).resize(
        this.app.screen.width,
        this.app.screen.height
      );
    }
  }

  async start() {
    await this.loadAssets();
    this.showMenuScene();
  }

  private async loadAssets() {
    // Load images
    const idleSheet = await Assets.load(CONFIG.CHARACTERS.bear.idle.path);
    const walkSheet = await Assets.load(CONFIG.CHARACTERS.bear.walk.path);
    const treeSheet = await Assets.load(CONFIG.ITEMS.tree.path);

    // Create textures from sheets
    this.bearAnimations = {
      idle: this.createFrames(
        idleSheet,
        CONFIG.CHARACTERS.bear.idle.frames,
        1,
        0
      ),
      walk: this.createFrames(
        walkSheet,
        CONFIG.CHARACTERS.bear.walk.frames,
        1,
        0
      ),
    };

    // Create tree animation from the 4th row (index 3)
    this.treeAnimation = this.createFrames(
      treeSheet,
      CONFIG.ITEMS.tree.cols,
      5, // Total rows in sheet
      3  // 4th row index
    );
  }

  private createFrames(
    baseTexture: Texture,
    cols: number,
    rows: number = 1,
    rowIdx: number = 0
  ): Texture[] {
    const frames: Texture[] = [];
    const frameW = baseTexture.width / cols;
    const frameH = baseTexture.height / rows;

    for (let i = 0; i < cols; i++) {
      const frame = new Texture({
        source: baseTexture.source,
        frame: new Rectangle(i * frameW, rowIdx * frameH, frameW, frameH),
      });
      frames.push(frame);
    }
    return frames;
  }

  showMenuScene() {
    this.cleanupCurrentScene();

    const menuScene = new MenuScene((playerCount, distance) => {
      const names = Array.from(
        { length: playerCount },
        (_, i) => `Racer ${i + 1}`
      );
      this.showRaceScene(names, distance);
    });

    this.currentScene = menuScene;
    this.app.stage.addChild(menuScene);
    this.onResize();

    this.updateFn = (ticker: Ticker) => {
      menuScene.update(ticker.deltaTime);
    };
    this.app.ticker.add(this.updateFn);
  }

  showRaceScene(playerNames: string[], distance: number) {
    this.cleanupCurrentScene();

    if (!this.bearAnimations) return;

    const raceScene = new RaceScene(
      playerNames,
      distance,
      this.bearAnimations,
      this.treeAnimation,
      (results) => {
        this.showResultScene(results);
      }
    );
    this.currentScene = raceScene;
    this.app.stage.addChild(raceScene);
    this.onResize();

    this.updateFn = (ticker: Ticker) => {
      raceScene.update(ticker.deltaTime);
    };
    this.app.ticker.add(this.updateFn);
  }

  showResultScene(results: Racer[]) {
    this.cleanupCurrentScene();

    const resultScene = new ResultScene(results, () => {
      this.showMenuScene();
    });
    this.currentScene = resultScene;
    this.app.stage.addChild(resultScene);
    this.onResize();

    this.updateFn = (ticker: Ticker) => {
      resultScene.update(ticker.deltaTime);
    };
    this.app.ticker.add(this.updateFn);
  }

  private cleanupCurrentScene() {
    if (this.updateFn) {
      this.app.ticker.remove(this.updateFn);
      this.updateFn = null;
    }

    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
      this.currentScene = null;
    }
  }
}
