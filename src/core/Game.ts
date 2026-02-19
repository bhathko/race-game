import { Application, Container, Ticker, Assets, Texture, Rectangle } from "pixi.js";
import {
  RaceScene,
  MenuScene,
  ResultScene,
  CharacterSelectionScene,
  LoadingScene,
} from "../scenes";
import { Racer } from "../entities";
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
    window.addEventListener("orientationchange", () => {
      // Orientation change often needs a small delay for dimensions to settle
      setTimeout(() => this.onResize(), 200);
    });
  }

  private onResize() {
    if (this.currentScene) {
      // Use requestAnimationFrame to ensure Pixi's 'resizeTo' logic
      // has updated app.screen before we read from it.
      requestAnimationFrame(() => {
        if (this.currentScene) {
          this.currentScene.resize(this.app.screen.width, this.app.screen.height);
        }
      });
    }
  }

  async start() {
    const loadingScene = new LoadingScene();
    this.setScene(loadingScene);

    await this.loadAssets((progress) => {
      loadingScene.setProgress(progress);
    });

    this.showMenuScene();
  }

  private async loadAssets(onProgress: (progress: number) => void) {
    const charKeys = Object.keys(CHARACTERS);
    const totalAssets = charKeys.length * 2 + 5; // idle/walk for each + 5 items
    let loadedCount = 0;

    const reportProgress = () => {
      loadedCount++;
      onProgress(loadedCount / totalAssets);
    };

    // Load character animations
    for (const key of charKeys) {
      const char = CHARACTERS[key as keyof typeof CHARACTERS];
      const idleSheet = await Assets.load(char.idle.path);
      reportProgress();
      const walkSheet = await Assets.load(char.walk.path);
      reportProgress();

      this.characterAnimations.set(key, {
        idle: this.createFrames(idleSheet, char.idle.frames, 1, 0),
        walk: this.createFrames(walkSheet, char.walk.frames, 1, 0),
      });
    }

    // Load other images
    const treeSheet = await Assets.load(ITEMS.tree.path);
    reportProgress();
    const groundSheet = await Assets.load(ITEMS.ground.path);
    reportProgress();
    const grassSheet = await Assets.load(ITEMS.grass.path);
    reportProgress();
    await Assets.load(ITEMS.trophy.path);
    reportProgress();
    await Assets.load(ITEMS.sound.path);
    reportProgress();

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
      new MenuScene((playerCount, distance, isFunnyMode) => {
        this.showCharacterSelectionScene(playerCount, distance, isFunnyMode);
      }),
    );
  }

  showCharacterSelectionScene(playerCount: number, distance: number, isFunnyMode?: boolean) {
    this.setScene(
      new CharacterSelectionScene(
        playerCount,
        distance,
        this.characterAnimations,
        (selectedKeys, dist) => {
          const names = selectedKeys.map((key) => {
            const char = CHARACTERS[key as keyof typeof CHARACTERS];
            return `The ${char.name}`;
          });
          this.showRaceScene(names, dist, selectedKeys, isFunnyMode);
        },
        () => this.showMenuScene(),
        isFunnyMode, // Pass to constructor
      ),
    );
  }

  showRaceScene(
    playerNames: string[],
    distance: number,
    selectedKeys?: string[],
    isFunnyMode?: boolean,
  ) {
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
        selectedKeys,
        isFunnyMode,
      ),
    );
  }

  showResultScene(results: Racer[]) {
    this.setScene(new ResultScene(results, () => this.showMenuScene(), this.characterAnimations));
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
