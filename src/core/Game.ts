import {
  Application,
  Container,
  Ticker,
  Assets,
  Texture,
  Rectangle,
} from "pixi.js";
import { RaceScene } from "../scenes/RaceScene";
import { MenuScene } from "../scenes/MenuScene";
import { ResultScene } from "../scenes/ResultScene";
import { Racer } from "../entities/Racer";
import { CHARACTERS, ITEMS } from "../config";
import type { Scene } from "./Scene";
import type { RacerAnimations, GroundTextures, GrassTextures } from "./types";

export class Game {
  private app: Application;
  private currentScene: (Container & Scene) | null = null;
  private updateFn: ((ticker: Ticker) => void) | null = null;
  private characterAnimations: Map<string, RacerAnimations> = new Map();
  private treeAnimation: Texture[] = [];
  private groundTextures: GroundTextures | null = null;
  private grassTextures: GrassTextures | null = null;

  constructor(app: Application) {
    this.app = app;
    window.addEventListener("resize", () => this.onResize());
  }

  private onResize() {
    if (this.currentScene) {
      this.currentScene.resize(this.app.screen.width, this.app.screen.height);
    }
  }

  async start() {
    await this.loadAssets();
    this.showMenuScene();
  }

  private async loadAssets() {
    // Load character animations
    for (const [key, char] of Object.entries(CHARACTERS)) {
      const idleSheet = await Assets.load(char.idle.path);
      const walkSheet = await Assets.load(char.walk.path);

      this.characterAnimations.set(key, {
        idle: this.createFrames(idleSheet, char.idle.frames, 1, 0),
        walk: this.createFrames(walkSheet, char.walk.frames, 1, 0),
      });
    }

    // Load other images
    const treeSheet = await Assets.load(ITEMS.tree.path);
    const groundSheet = await Assets.load(ITEMS.ground.path);
    const grassSheet = await Assets.load(ITEMS.grass.path);

    // Create tree animation from the 4th row (index 3)
    this.treeAnimation = this.createFrames(
      treeSheet,
      ITEMS.tree.cols,
      5, // Total rows in sheet
      3, // 4th row index
    );

    const groundUnit = ITEMS.ground.unit;
    this.groundTextures = {
      top: new Texture({
        source: groundSheet.source,
        frame: new Rectangle(0, 0, groundUnit, groundUnit),
      }),
      middle: new Texture({
        source: groundSheet.source,
        frame: new Rectangle(0, groundUnit, groundUnit, groundUnit),
      }),
      bottom: new Texture({
        source: groundSheet.source,
        frame: new Rectangle(0, groundUnit * 2, groundUnit, groundUnit),
      }),
    };

    const grassUnit = ITEMS.grass.unit;
    this.grassTextures = {
      top: new Texture({
        source: grassSheet.source,
        frame: new Rectangle(0, 0, grassUnit, grassUnit),
      }),
      middle: new Texture({
        source: grassSheet.source,
        frame: new Rectangle(0, grassUnit, grassUnit, grassUnit),
      }),
      bottom: new Texture({
        source: grassSheet.source,
        frame: new Rectangle(0, grassUnit * 2, grassUnit, grassUnit),
      }),
    };
  }

  private createFrames(
    baseTexture: Texture,
    cols: number,
    rows: number = 1,
    rowIdx: number = 0,
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
    this.setScene(
      new MenuScene((playerCount, distance) => {
        const names = Array.from(
          { length: playerCount },
          (_, i) => `Racer ${i + 1}`,
        );
        this.showRaceScene(names, distance);
      }),
    );
  }

  showRaceScene(playerNames: string[], distance: number) {
    if (!this.groundTextures || !this.grassTextures) return;

    this.setScene(
      new RaceScene(
        playerNames,
        distance,
        this.characterAnimations,
        this.treeAnimation,
        this.groundTextures,
        this.grassTextures,
        (results) => this.showResultScene(results),
      ),
    );
  }

  showResultScene(results: Racer[]) {
    this.setScene(
      new ResultScene(
        results,
        () => this.showMenuScene(),
        this.characterAnimations,
      ),
    );
  }

  // ── helpers ─────────────────────────────────────────────────────────────

  /** Mount a new scene, tearing down the previous one. */
  private setScene(scene: Container & Scene) {
    this.cleanupCurrentScene();
    this.currentScene = scene;
    this.app.stage.addChild(scene);
    this.onResize();

    this.updateFn = (ticker: Ticker) => scene.update(ticker.deltaTime);
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
