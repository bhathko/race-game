import {
  Container,
  Graphics,
  Text,
  TextStyle,
  AnimatedSprite,
  Texture,
  TilingSprite,
} from "pixi.js";
import { sound } from "@pixi/sound";
import type { IMediaInstance } from "@pixi/sound";
import { Racer } from "../../entities/Racer";
import { createRacers } from "../../factories/RacerFactory";
import {
  CANVAS,
  RACER,
  TRACK,
  ITEMS,
  GAMEPLAY,
  VISUALS,
  COLORS,
  PALETTE,
} from "../../config";
import type { Scene } from "../../core/Scene";
import type {
  RacerAnimations,
  GroundTextures,
  GrassTextures,
} from "../../core/types";

/** Track-line color palette. */
export const TRACK_COLORS = {
  CREAM: 0xfff9c4,
  DARK_BROWN: COLORS.RANK_DEFAULT,
  WARM_RED: 0xff8a65,
} as const;

export interface RaceState {
  racers: Racer[];
  finishedRacers: Racer[];
  elapsedTime: number;
  raceStarted: boolean;
  entranceFinished: boolean;
  countdownTimer: number;
  racerCharacters: Map<Racer, string>;
  musicInstance: IMediaInstance | null;
  currentMusicVolume: number;
  targetMusicVolume: number;
}

export abstract class BaseRaceScene extends Container implements Scene {
  protected world: Container;
  protected worldMask: Graphics;
  protected ui: Container;
  protected racers: Racer[] = [];
  protected finishedRacers: Racer[] = [];
  protected trackGraphics: Graphics;

  protected groundContainer: Container;
  protected topEdge: TilingSprite;
  protected middleGround: TilingSprite;
  protected bottomEdge: TilingSprite;

  protected grassContainer: Container;
  protected topGrassEdge: TilingSprite;
  protected topGrassMiddle: TilingSprite;
  protected bottomGrassEdge: TilingSprite;
  protected bottomGrassMiddle: TilingSprite;

  protected leaderboardContainer: Container;
  protected sidebarBg: Graphics;
  protected leaderboardItems: Map<Racer, Container> = new Map();
  protected racerCharacters: Map<Racer, string> = new Map();
  protected elapsedTime: number = 0;
  protected raceEnded: boolean = false;
  protected trackWidth: number = 0;
  protected finishLineX: number = 0;
  protected onFinished: (results: Racer[]) => void;
  protected distance: number;
  protected characterAnimations: Map<string, RacerAnimations>;
  protected treeAnimation: Texture[];
  protected groundTextures: GroundTextures;
  protected grassTextures: GrassTextures;

  protected gameViewW: number = 0;
  protected gameViewH: number = 0;
  protected isPortrait: boolean = false;

  protected entranceFinished: boolean = false;
  protected countdownTimer: number = VISUALS.COUNTDOWN_DURATION;
  protected countdownText: Text | null = null;
  protected remainingDistanceText: Text | null = null;
  protected raceStarted: boolean = false;

  protected leaderboardUpdateTimer: number = 0;
  protected readonly LEADERBOARD_THROTTLE: number = 30;
  protected sortedRacersCache: Racer[] = [];

  protected musicInstance: IMediaInstance | null = null;
  protected targetMusicVolume: number = 0;
  protected currentMusicVolume: number = 0;

  constructor(
    playerNames: string[],
    distance: number,
    characterAnimations: Map<string, RacerAnimations>,
    treeAnimation: Texture[],
    groundTextures: GroundTextures,
    grassTextures: GrassTextures,
    onFinished: (results: Racer[]) => void,
    selectedKeys?: string[],
    existingState?: RaceState
  ) {
    super();
    this.onFinished = onFinished;
    this.distance = distance;
    this.characterAnimations = characterAnimations;
    this.treeAnimation = treeAnimation;
    this.groundTextures = groundTextures;
    this.grassTextures = grassTextures;

    this.worldMask = new Graphics();
    this.addChild(this.worldMask);

    this.world = new Container();
    this.world.mask = this.worldMask;
    this.addChild(this.world);

    this.ui = new Container();
    this.addChild(this.ui);

    this.sidebarBg = new Graphics();
    this.ui.addChild(this.sidebarBg);

    this.leaderboardContainer = new Container();
    this.ui.addChild(this.leaderboardContainer);

    const titleStyle = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 24,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 4 },
      dropShadow: {
        alpha: 0.5, angle: Math.PI / 2, blur: 0, color: PALETTE.STR_BLACK, distance: 4,
      },
    });
    const title = new Text({ text: "RANKING", style: titleStyle });
    title.label = "leaderboard-title";
    this.leaderboardContainer.addChild(title);

    this.grassContainer = new Container();
    this.world.addChild(this.grassContainer);
    this.topGrassMiddle = new TilingSprite({ texture: this.grassTextures.middle });
    this.topGrassEdge = new TilingSprite({ texture: this.grassTextures.bottom });
    this.bottomGrassMiddle = new TilingSprite({ texture: this.grassTextures.middle });
    this.bottomGrassEdge = new TilingSprite({ texture: this.grassTextures.top });
    this.grassContainer.addChild(this.topGrassMiddle, this.topGrassEdge, this.bottomGrassMiddle, this.bottomGrassEdge);

    this.groundContainer = new Container();
    this.world.addChild(this.groundContainer);
    this.middleGround = new TilingSprite({ texture: this.groundTextures.middle });
    this.topEdge = new TilingSprite({ texture: this.groundTextures.top, height: ITEMS.ground.unit });
    this.bottomEdge = new TilingSprite({ texture: this.groundTextures.bottom, height: ITEMS.ground.unit });
    this.groundContainer.addChild(this.middleGround, this.topEdge, this.bottomEdge);

    this.trackGraphics = new Graphics();
    this.world.addChild(this.trackGraphics);

    if (existingState) {
      this.racers = existingState.racers;
      this.finishedRacers = existingState.finishedRacers;
      this.elapsedTime = existingState.elapsedTime;
      this.raceStarted = existingState.raceStarted;
      this.entranceFinished = existingState.entranceFinished;
      this.countdownTimer = existingState.countdownTimer;
      this.racerCharacters = existingState.racerCharacters;
      this.musicInstance = existingState.musicInstance;
      this.currentMusicVolume = existingState.currentMusicVolume;
      this.targetMusicVolume = existingState.targetMusicVolume;

      // Re-add racers to new world
      this.racers.forEach(r => this.world.addChild(r));
    } else {
      this.initNewRace(playerNames, selectedKeys);
    }

    this.initLeaderboardUI();
    this.initCountdownUI();
    this.initDistanceUI();
  }

  private initNewRace(playerNames: string[], selectedKeys?: string[]) {
    const results = createRacers(playerNames, this.characterAnimations, selectedKeys);
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }
    results.forEach(({ racer, characterKey }) => {
      this.racers.push(racer);
      this.racerCharacters.set(racer, characterKey);
      this.world.addChild(racer);
    });
  }

  public getState(): RaceState {
    return {
      racers: this.racers,
      finishedRacers: this.finishedRacers,
      elapsedTime: this.elapsedTime,
      raceStarted: this.raceStarted,
      entranceFinished: this.entranceFinished,
      countdownTimer: this.countdownTimer,
      racerCharacters: this.racerCharacters,
      musicInstance: this.musicInstance,
      currentMusicVolume: this.currentMusicVolume,
      targetMusicVolume: this.targetMusicVolume
    };
  }

  protected initCountdownUI() {
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 120,
      fontWeight: "900",
      stroke: { color: COLORS.TEXT_MARKER, width: 12 },
      dropShadow: { alpha: 0.5, angle: Math.PI / 6, blur: 0, color: PALETTE.STR_BLACK, distance: 8 },
    });
    this.countdownText = new Text({ text: Math.ceil(this.countdownTimer).toString(), style });
    this.countdownText.anchor.set(0.5);
    this.countdownText.visible = this.entranceFinished && !this.raceStarted;
    this.ui.addChild(this.countdownText);
  }

  protected initDistanceUI() {
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE, fontSize: 80, fontWeight: "900",
      stroke: { color: COLORS.TEXT_MARKER, width: 8 },
      dropShadow: { alpha: 0.5, angle: Math.PI / 4, blur: 4, color: PALETTE.STR_BLACK, distance: 6 },
    });
    this.remainingDistanceText = new Text({ text: `${this.distance}m`, style });
    this.remainingDistanceText.anchor.set(0.5, 0);
    this.ui.addChild(this.remainingDistanceText);
  }

  protected initLeaderboardUI() {
    this.racers.forEach((racer) => {
      const container = new Container();
      const bg = new Graphics();
      bg.label = "item-bg";
      container.addChild(bg);

      const charKey = this.racerCharacters.get(racer) || "bear";
      const anims = this.characterAnimations.get(charKey)!;
      const icon = new AnimatedSprite(anims.idle);
      icon.label = "item-icon";
      icon.anchor.set(0.5);
      icon.animationSpeed = 0.1;
      icon.play();
      container.addChild(icon);

      const text = new Text({
        text: racer.racerName,
        style: new TextStyle({ fill: PALETTE.STR_WHITE, fontSize: 16, fontWeight: "900", stroke: { color: PALETTE.STR_BLACK, width: 3 } })
      });
      text.label = "item-text";
      container.addChild(text);

      this.leaderboardContainer.addChild(container);
      this.leaderboardItems.set(racer, container);
    });
  }

  protected setupTracks() {
    const count = this.racers.length;
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / count;

    this.topGrassMiddle.width = this.trackWidth;
    this.topGrassMiddle.height = grassStripH - unit;
    this.topGrassMiddle.y = 0;
    this.topGrassEdge.width = this.trackWidth;
    this.topGrassEdge.height = unit;
    this.topGrassEdge.y = grassStripH - unit;
    this.bottomGrassEdge.width = this.trackWidth;
    this.bottomGrassEdge.height = unit;
    this.bottomGrassEdge.y = this.gameViewH - grassStripH;
    this.bottomGrassMiddle.width = this.trackWidth;
    this.bottomGrassMiddle.height = grassStripH - unit;
    this.bottomGrassMiddle.y = this.gameViewH - grassStripH + unit;

    this.topEdge.width = this.trackWidth;
    this.topEdge.y = grassStripH;
    this.bottomEdge.width = this.trackWidth;
    this.bottomEdge.y = this.gameViewH - grassStripH - unit;
    this.middleGround.width = this.trackWidth;
    this.middleGround.height = dirtH - unit * 2;
    this.middleGround.y = grassStripH + unit;

    this.trackGraphics.clear();
    const { CREAM: colorLight, DARK_BROWN: colorDark, WARM_RED: colorRed } = TRACK_COLORS;

    // Dividers
    const dividerSize = 8;
    const dividerGap = 16;
    for (let i = 1; i < count; i++) {
      const y = Math.floor(grassStripH + i * trackHeight - dividerSize / 2);
      for (let x = 0; x < this.trackWidth; x += dividerSize + dividerGap) {
        this.trackGraphics.roundRect(x, y, dividerSize, dividerSize, 2).fill({ color: colorDark, alpha: 0.3 });
      }
    }

    // Start Line
    const startBlockSize = 16;
    for (let y = grassStripH; y <= this.gameViewH - grassStripH - startBlockSize; y += startBlockSize) {
      this.trackGraphics.roundRect(TRACK.START_LINE_X - startBlockSize, y, startBlockSize, startBlockSize, 4).fill({ color: colorLight })
        .roundRect(TRACK.START_LINE_X, y, startBlockSize, startBlockSize, 4).fill({ color: colorRed });
    }

    // Finish Line
    const finishBlockSize = 16;
    for (let col = 0; col < 2; col++) {
      const x = this.finishLineX + col * finishBlockSize;
      for (let row = 0; row * finishBlockSize <= dirtH - finishBlockSize; row++) {
        const y = grassStripH + row * finishBlockSize;
        const color = (row + col) % 2 === 0 ? colorLight : colorDark;
        this.trackGraphics.roundRect(x, y, finishBlockSize, finishBlockSize, 4).fill({ color });
      }
    }

    // Markers & Trees
    this.world.children.filter(c => (c instanceof Text && (c.text.includes("m") || c.label === "start-label")) || (c instanceof AnimatedSprite && c.label === "distance-tree"))
      .forEach(c => this.world.removeChild(c));

    const unitWidth = Math.max(this.gameViewW, CANVAS.MIN_UNIT_WIDTH);
    for (let m = 10; m <= this.distance; m += 10) {
      const x = TRACK.START_LINE_X + (m / 50) * unitWidth;
      [0, 1].forEach(top => {
        const tree = new AnimatedSprite(this.treeAnimation);
        tree.label = "distance-tree";
        tree.anchor.set(0.5, top);
        tree.width = tree.height = ITEMS.tree.width;
        tree.x = x;
        tree.y = top ? (grassStripH - ITEMS.tree.height) / 2 : this.gameViewH - (grassStripH - ITEMS.tree.height) / 2;
        tree.animationSpeed = 0.1;
        tree.play();
        this.world.addChild(tree);
      });
    }
  }

  protected repositionRacers() {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racers.length;
    this.racers.forEach((racer, i) => {
      racer.y = grassStripH + (i + 0.5) * trackHeight + RACER.HEIGHT / 2;
    });
  }

  public abstract resize(width: number, height: number): void;
  protected abstract updateLeaderboard(delta: number): void;

  update(delta: number) {
    if (this.musicInstance) {
      if (this.currentMusicVolume !== this.targetMusicVolume) {
        const step = delta * 0.015;
        this.currentMusicVolume = this.currentMusicVolume < this.targetMusicVolume 
          ? Math.min(this.targetMusicVolume, this.currentMusicVolume + step)
          : Math.max(this.targetMusicVolume, this.currentMusicVolume - step);
        this.musicInstance.volume = this.currentMusicVolume;
        if (this.raceEnded && this.currentMusicVolume <= 0) {
          this.musicInstance.stop();
          this.musicInstance = null;
        }
      }
    }

    if (this.raceEnded) return;

    if (!this.entranceFinished) {
      let allAtStart = true;
      this.racers.forEach(r => { if (!r.walkEntrance(TRACK.START_LINE_X, delta)) allAtStart = false; });
      if (allAtStart) {
        this.entranceFinished = true;
        if (this.countdownText) this.countdownText.visible = true;
      }
      return;
    }

    if (!this.raceStarted) {
      this.countdownTimer -= delta / 60;
      if (this.countdownTimer <= 0) {
        this.raceStarted = true;
        const musicPromise = sound.play("sound", { loop: true, volume: 0 });
        const setMusic = (instance: IMediaInstance) => {
          this.musicInstance = instance;
          this.targetMusicVolume = 1;
          this.currentMusicVolume = 0;
        };
        if (musicPromise instanceof Promise) musicPromise.then(setMusic);
        else setMusic(musicPromise);

        if (this.countdownText) {
          this.countdownText.text = "GO!";
          setTimeout(() => { if (this.countdownText) this.countdownText.visible = false; }, 1000);
        }
      } else if (this.countdownText) {
        this.countdownText.text = Math.ceil(this.countdownTimer).toString();
      }
      return;
    }

    this.elapsedTime += delta;
    const activeRacers = this.racers.filter(r => !r.isFinished());
    const ranked = [...activeRacers].sort((a, b) => b.x - a.x);
    const rankMap = new Map<Racer, number>();
    ranked.forEach((r, i) => rankMap.set(r, i + 1));

    const totalDistPx = this.finishLineX - TRACK.START_LINE_X;
    const leaderX = ranked[0]?.x || 0;
    const climaxThreshold = this.finishLineX - totalDistPx * GAMEPLAY.BALANCE.CLIMAX_THRESHOLD;
    const inClimaxPhase = activeRacers.some(r => r.x >= climaxThreshold);

    this.racers.forEach(racer => {
      if (!racer.isFinished()) {
        racer.update(delta, this.elapsedTime, leaderX, this.finishLineX, rankMap.get(racer) || 1, totalDistPx, inClimaxPhase, activeRacers.length);
        if (racer.x >= this.finishLineX - RACER.WIDTH + RACER.COLLISION_OFFSET) {
          racer.x = this.finishLineX - RACER.WIDTH + RACER.COLLISION_OFFSET;
          racer.setFinished(this.elapsedTime);
          this.finishedRacers.push(racer);
        }
      }
    });

    if (this.remainingDistanceText) {
      const leader = ranked[0] || this.racers[0];
      const distToFinishM = Math.ceil((Math.max(0, this.finishLineX - leader.x) / totalDistPx) * this.distance);
      this.remainingDistanceText.text = `${distToFinishM}m`;
    }

    this.updateLeaderboard(delta);
    
    let activeLeaderX = activeRacers.length > 0 ? leaderX : Math.max(...this.racers.map(r => r.x));
    this.updateCamera(activeLeaderX, delta);
    if (this.racers.every(r => r.isFinished())) this.endRace();
  }

  protected updateCamera(leaderX: number, delta: number) {
    let targetX = Math.max(0, Math.min(leaderX - this.gameViewW / 2, this.trackWidth - this.gameViewW));
    const smoothing = 1 - Math.pow(1 - VISUALS.CAMERA_SMOOTHING, delta);
    this.world.x = -( (-this.world.x) + (targetX - (-this.world.x)) * smoothing );
  }

  protected endRace() {
    this.raceEnded = true;
    this.targetMusicVolume = 0;
    setTimeout(() => this.onFinished(this.finishedRacers), VISUALS.RESULT_DELAY);
  }
}
