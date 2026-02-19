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
import { Racer, Hole } from "../../entities";
import { createRacers } from "../../factories";
import { createWoodenButton } from "../../ui";
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
import type {
  Scene,
  RaceContext,
  RacerAnimations,
  GroundTextures,
  GrassTextures,
} from "../../core";

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

  // Funny Mode State
  protected isFunnyMode: boolean = false;
  protected setupPhase: boolean = false;
  protected setupFinished: boolean = false;
  protected currentSetupPlayerIndex: number = 0;
  protected holes: Hole[] = [];
  protected setupInstructionText: Text | null = null;
  protected startMatchBtn: Container | null = null;
  protected scrollLeftBtn: Container | null = null;
  protected scrollRightBtn: Container | null = null;
  protected laneLabels: Container[] = [];
  protected previewHole: Hole | null = null;

  constructor(ctx: RaceContext, existingState?: RaceState) {
    super();
    this.onFinished = ctx.onFinished;
    this.distance = ctx.distance;
    this.characterAnimations = ctx.characterAnimations;
    this.treeAnimation = ctx.treeAnimation;
    this.groundTextures = ctx.groundTextures;
    this.grassTextures = ctx.grassTextures;
    this.isFunnyMode = !!ctx.isFunnyMode;

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

      this.setupFinished = true;

      // Re-add racers to new world
      this.racers.forEach(r => this.world.addChild(r));
    } else {
      this.initNewRace(ctx.playerNames, ctx.selectedKeys);
    }

    this.initLeaderboardUI();
    this.initCountdownUI();
    this.initDistanceUI();

    if (this.isFunnyMode && !existingState) {
        if (this.countdownText) this.countdownText.visible = false; 
    }
  }

  private initNewRace(playerNames: string[], selectedKeys?: string[]) {
    const results = createRacers(playerNames, this.characterAnimations, selectedKeys);
    
    // Maintain selection order in array
    results.forEach(({ racer, characterKey }) => {
      this.racers.push(racer);
      this.racerCharacters.set(racer, characterKey);
      
      if (!this.isFunnyMode) {
        // Lane assignment will happen in repositionRacers
        this.world.addChild(racer);
      }
    });

    if (!this.isFunnyMode) {
        // Randomly assign lanes initially for non-funny mode
        const laneIndices = this.racers.map((_, i) => i);
        for (let i = laneIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [laneIndices[i], laneIndices[j]] = [laneIndices[j], laneIndices[i]];
        }
        this.racers.forEach((r, i) => r.laneIndex = laneIndices[i]);
    }
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

    const totalDistPx = this.finishLineX - TRACK.START_LINE_X;
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

    // Place Obstacles (Holes)
    if (!this.isFunnyMode) {
      this.holes.forEach(h => this.world.removeChild(h));
      this.holes = [];
      for (let i = 0; i < count; i++) {
        const laneY = grassStripH + (i + 0.5) * trackHeight;
        const x = TRACK.START_LINE_X + (0.2 + Math.random() * 0.6) * totalDistPx;
        const hole = new Hole();
        hole.x = x;
        hole.y = laneY;
        hole.laneIndex = i;
        this.holes.push(hole);
        this.world.addChild(hole);
        this.world.setChildIndex(hole, this.world.getChildIndex(this.trackGraphics) + 1);
      }
    } else {
      this.holes.forEach(hole => {
        if (hole.laneIndex !== -1) {
          hole.y = this.getLaneRacerY(hole.laneIndex);
        }
      });
    }
  }

  protected skipBtn: Container | null = null;

  protected setupFunnyModeInteraction() {
    this.setupPhase = true;
    this.currentSetupPlayerIndex = 0;
    
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 36,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 6 },
      dropShadow: { alpha: 0.5, blur: 4, distance: 4 }
    });
    this.setupInstructionText = new Text({ text: "", style });
    this.setupInstructionText.anchor.set(0.5);
    this.setupInstructionText.x = this.gameViewW / 2;
    this.setupInstructionText.y = 60;
    this.ui.addChild(this.setupInstructionText);

    this.updateSetupInstruction();

    if (this.remainingDistanceText) this.remainingDistanceText.visible = false;

    this.world.eventMode = "static";
    this.world.cursor = "crosshair";
    this.world.on("pointerdown", (e) => this.handleSetupClick(e));

    this.skipBtn = createWoodenButton({
      label: "SKIP",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => this.handleSkipPlacement(),
      width: 140,
      height: 50,
      fontSize: 20
    });
    this.skipBtn.x = this.gameViewW / 2;
    this.skipBtn.y = 130;
    this.ui.addChild(this.skipBtn);

    this.startMatchBtn = createWoodenButton({
      label: "START MATCH",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () => this.finishSetupPhase(),
      width: 280,
      height: 70,
      fontSize: 28
    });
    this.startMatchBtn.visible = false;
    this.ui.addChild(this.startMatchBtn);

    this.previewHole = new Hole();
    this.previewHole.alpha = 0.5;
    this.previewHole.visible = false;
    this.world.addChild(this.previewHole);

    this.world.on("pointermove", (e) => this.handleSetupHover(e));

    if (this.trackWidth > this.gameViewW) {
      this.scrollLeftBtn = createWoodenButton({
        label: "<", color: COLORS.BUTTON_PRIMARY, onClick: () => this.handleScrollSetup("left"), width: 60, height: 60, fontSize: 32
      });
      this.scrollLeftBtn.x = 50;
      this.scrollLeftBtn.y = this.gameViewH / 2;
      this.ui.addChild(this.scrollLeftBtn);

      this.scrollRightBtn = createWoodenButton({
        label: ">", color: COLORS.BUTTON_PRIMARY, onClick: () => this.handleScrollSetup("right"), width: 60, height: 60, fontSize: 32
      });
      this.scrollRightBtn.x = this.gameViewW - 50;
      this.scrollRightBtn.y = this.gameViewH / 2;
      this.ui.addChild(this.scrollRightBtn);
    }
  }

  protected handleScrollSetup(direction: "left" | "right") {
    const scrollAmount = 300;
    let targetX = this.world.x + (direction === "left" ? scrollAmount : -scrollAmount);
    const minX = -(this.trackWidth - this.gameViewW);
    const maxX = 0;
    this.world.x = Math.max(minX, Math.min(maxX, targetX));
  }

  protected handleSkipPlacement() {
    if (!this.setupPhase || this.currentSetupPlayerIndex >= this.racers.length) return;
    this.currentSetupPlayerIndex++;
    this.updateSetupInstruction();

    if (this.currentSetupPlayerIndex >= this.racers.length) {
      if (this.startMatchBtn) {
        this.startMatchBtn.visible = true;
        this.startMatchBtn.x = this.gameViewW / 2;
        this.startMatchBtn.y = this.gameViewH / 2;
      }
      if (this.skipBtn) this.skipBtn.visible = false;
      if (this.previewHole) this.previewHole.visible = false;
    }
  }

  /** Get the actual racer Y for a given lane index */
  protected getLaneRacerY(laneIndex: number): number {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racers.length;
    return grassStripH + (laneIndex + 0.5) * trackHeight;
  }

  protected getNearestLaneIndex(localY: number): number | null {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    if (localY < grassStripH || localY > this.gameViewH - grassStripH) return null;

    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racers.length;
    let minDist = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < this.racers.length; i++) {
      const laneCenterY = grassStripH + (i + 0.5) * trackHeight;
      const dist = Math.abs(localY - laneCenterY);
      if (dist < minDist) { minDist = dist; bestIdx = i; }
    }
    return bestIdx;
  }

  protected handleSetupHover(e: any) {
    if (!this.setupPhase || !this.previewHole || this.currentSetupPlayerIndex >= this.racers.length) {
        if (this.previewHole) this.previewHole.visible = false;
        return;
    }

    const localPos = this.world.toLocal(e.global);
    const laneIdx = this.getNearestLaneIndex(localPos.y);

    if (laneIdx !== null && localPos.x >= TRACK.START_LINE_X + 100 && localPos.x <= this.finishLineX - 50) {
        const racerY = this.getLaneRacerY(laneIdx);
        this.previewHole.visible = true;
        this.previewHole.x = localPos.x;
        this.previewHole.y = racerY;
        this.previewHole.laneIndex = laneIdx;
        this.world.setChildIndex(this.previewHole, this.world.children.length - 1);
    } else {
        this.previewHole.visible = false;
    }
  }

  protected updateSetupInstruction() {
    if (!this.setupInstructionText) return;
    if (this.currentSetupPlayerIndex < this.racers.length) {
      this.setupInstructionText.text = `Player ${this.currentSetupPlayerIndex + 1}: Place a Trap!`;
      this.setupInstructionText.style.fill = PALETTE.STR_WHITE;
    } else {
      this.setupInstructionText.text = "All Traps Placed!";
      this.setupInstructionText.style.fill = PALETTE.STR_SUCCESS;
    }
  }

  protected handleSetupClick(e: any) {
    if (!this.setupPhase || this.currentSetupPlayerIndex >= this.racers.length) return;

    const localPos = this.world.toLocal(e.global);
    if (localPos.x < TRACK.START_LINE_X + 100 || localPos.x > this.finishLineX - 50) return;
    
    const laneIdx = this.getNearestLaneIndex(localPos.y);
    if (laneIdx === null) return;

    const racerY = this.getLaneRacerY(laneIdx);
    const hole = new Hole();
    hole.x = localPos.x;
    hole.y = racerY;
    hole.laneIndex = laneIdx;
    this.world.addChild(hole);
    this.world.setChildIndex(hole, this.world.getChildIndex(this.trackGraphics) + 1);
    this.holes.push(hole);

    this.currentSetupPlayerIndex++;
    this.updateSetupInstruction();

    if (this.currentSetupPlayerIndex >= this.racers.length) {
      if (this.startMatchBtn) {
        this.startMatchBtn.visible = true;
        this.startMatchBtn.x = this.gameViewW / 2;
        this.startMatchBtn.y = this.gameViewH / 2;
      }
      if (this.skipBtn) this.skipBtn.visible = false;
      if (this.previewHole) this.previewHole.visible = false;
    }
  }

  protected finishSetupPhase() {
    this.setupPhase = false;
    this.setupFinished = true;
    this.world.eventMode = "none";
    this.world.cursor = "default";
    
    if (this.setupInstructionText) this.setupInstructionText.visible = false;
    if (this.startMatchBtn) this.startMatchBtn.visible = false;
    if (this.skipBtn) { this.skipBtn.destroy(); this.skipBtn = null; }
    if (this.scrollLeftBtn) { this.scrollLeftBtn.destroy(); this.scrollLeftBtn = null; }
    if (this.scrollRightBtn) { this.scrollRightBtn.destroy(); this.scrollRightBtn = null; }
    
    if (this.previewHole) {
        this.previewHole.destroy();
        this.previewHole = null;
    }
    this.world.off("pointermove");

    if (this.remainingDistanceText) this.remainingDistanceText.visible = true;

    const laneIndices = this.racers.map((_, i) => i);
    for (let i = laneIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [laneIndices[i], laneIndices[j]] = [laneIndices[j], laneIndices[i]];
    }

    this.racers.forEach((racer, i) => {
        racer.laneIndex = laneIndices[i];
        racer.x = -100;
        this.world.addChild(racer);
    });
    this.repositionRacers();

    this.entranceFinished = false;
    this.raceStarted = false;
  }

  protected repositionRacers() {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racers.length;
    this.racers.forEach((racer) => {
      racer.y = grassStripH + (racer.laneIndex + 0.5) * trackHeight;
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

    if (this.setupPhase) return;
    if (this.raceEnded) return;

    if (this.isFunnyMode && !this.setupFinished && !this.setupPhase && !this.raceStarted) {
      this.setupFunnyModeInteraction();
      return;
    }

    let activeLeaderX = 0;

    if (!this.entranceFinished) {
      let allAtStart = true;
      this.racers.forEach(r => { if (!r.walkEntrance(TRACK.START_LINE_X, delta)) allAtStart = false; });
      if (allAtStart) {
        this.entranceFinished = true;
        if (this.countdownText) {
          this.countdownText.visible = true;
          this.countdownText.text = Math.ceil(this.countdownTimer).toString();
        }
      }
      activeLeaderX = Math.max(0, ...this.racers.map(r => r.x));
    } else if (!this.raceStarted) {
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
      activeLeaderX = Math.max(0, ...this.racers.map(r => r.x));
    } else {
      this.elapsedTime += delta;
      const activeRacers = this.racers.filter(r => !r.isFinished());
      
      if (this.isFunnyMode && this.holes.length > 0) {
          for (let i = this.holes.length - 1; i >= 0; i--) {
              const hole = this.holes[i];
              for (const racer of activeRacers) {
                  const dx = Math.abs(racer.x - hole.x);
                  const dy = Math.abs(racer.y - hole.y);
                  if (dx < 50 && (racer.laneIndex === hole.laneIndex || dy < 10)) {
                      racer.applyHoleEffect();
                      this.world.removeChild(hole);
                      this.holes.splice(i, 1);
                      break;
                  }
              }
          }
      }

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
      activeLeaderX = activeRacers.length > 0 ? leaderX : Math.max(...this.racers.map(r => r.x));
    }

    this.updateCamera(activeLeaderX, delta);
    if (this.racers.length > 0 && this.racers.every(r => r.isFinished())) this.endRace();
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
