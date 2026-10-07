import { Container, Graphics } from "pixi.js";
import { sound } from "@pixi/sound";
import type { IMediaInstance } from "@pixi/sound";
import { Racer, Hole } from "../../entities";
import { createRacers } from "../../factories";
import { RACER, TRACK, GAMEPLAY, VISUALS, UI } from "../../config";
import { setFontSize } from "../../ui";
import type {
  Scene,
  RaceContext,
  RacerAnimations,
  GroundTextures,
  GrassTextures,
  TrackLayoutData,
} from "../../core";
import { TrackManager } from "./TrackManager";
import { FunnyModeManager } from "./FunnyModeManager";
import { RaceUIManager } from "./RaceUIManager";
import { stepRace } from "./RaceEngine";

/** A racer must lead its neighbour by this much before they swap places on the leaderboard. */
const LEADERBOARD_SWAP_MARGIN_PX = 12;

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
  holes: Hole[];
  setupPhase: boolean;
  setupFinished: boolean;
  currentSetupPlayerIndex: number;
}

export abstract class BaseRaceScene extends Container implements Scene {
  protected world: Container;
  protected worldMask: Graphics;
  protected ui: Container;

  protected trackManager: TrackManager;
  protected funnyModeManager: FunnyModeManager | null = null;
  protected uiManager: RaceUIManager;

  protected racers: Racer[] = [];
  protected finishedRacers: Racer[] = [];
  protected racerCharacters: Map<Racer, string> = new Map();

  protected elapsedTime: number = 0;
  protected raceEnded: boolean = false;
  protected trackLayout: TrackLayoutData | null = null;

  protected onFinished: (results: Racer[]) => void;
  protected distance: number;
  protected characterAnimations: Map<string, RacerAnimations>;
  protected groundTextures: GroundTextures;
  protected grassTextures: GrassTextures;

  protected gameViewW: number = 0;
  protected gameViewH: number = 0;
  /** Full screen size from the last resize (Container.width/height are content bounds, not the screen). */
  protected screenW: number = 0;
  protected screenH: number = 0;
  protected isPortrait: boolean = false;

  protected entranceFinished: boolean = false;
  protected countdownTimer: number = VISUALS.COUNTDOWN_DURATION;
  protected raceStarted: boolean = false;

  protected musicInstance: IMediaInstance | null = null;
  protected targetMusicVolume: number = 0;
  protected currentMusicVolume: number = 0;

  /** Order currently shown on the leaderboard (see getLeaderboardOrder). */
  private boardOrder: Racer[] = [];
  /** First camera update after (re)building a layout snaps instead of easing. */
  private cameraSnapped: boolean = false;

  protected isFunnyMode: boolean = false;
  protected setupPhase: boolean = false;
  protected setupFinished: boolean = false;
  protected currentSetupPlayerIndex: number = 0;
  protected holes: Hole[] = [];

  constructor(ctx: RaceContext, existingState?: RaceState) {
    super();
    this.onFinished = ctx.onFinished;
    this.distance = ctx.distance;
    this.characterAnimations = ctx.characterAnimations;
    this.groundTextures = ctx.groundTextures;
    this.grassTextures = ctx.grassTextures;
    this.isFunnyMode = !!ctx.isFunnyMode;

    this.worldMask = new Graphics();
    this.addChild(this.worldMask);

    this.world = new Container();
    this.world.sortableChildren = true;
    this.world.mask = this.worldMask;
    this.addChild(this.world);

    this.ui = new Container();
    this.addChild(this.ui);

    this.trackManager = new TrackManager(
      this.grassTextures,
      this.groundTextures,
      ctx.treeAnimation,
    );
    this.world.addChild(this.trackManager);

    this.uiManager = new RaceUIManager(this.ui);
    this.uiManager.initCountdown();
    this.uiManager.initDistance();

    if (existingState) {
      this.restoreState(existingState);
    } else {
      this.initNewRace(ctx.playerNames, ctx.selectedKeys);
    }

    this.uiManager.initLeaderboard(this.racers, this.racerCharacters, this.characterAnimations);
  }

  private restoreState(s: RaceState) {
    this.racers = s.racers;
    this.finishedRacers = s.finishedRacers;
    this.elapsedTime = s.elapsedTime;
    this.raceStarted = s.raceStarted;
    this.entranceFinished = s.entranceFinished;
    this.countdownTimer = s.countdownTimer;
    this.racerCharacters = s.racerCharacters;
    this.musicInstance = s.musicInstance;
    this.currentMusicVolume = s.currentMusicVolume;
    this.targetMusicVolume = s.targetMusicVolume;

    this.holes = s.holes;
    this.setupPhase = s.setupPhase;
    this.setupFinished = s.setupFinished;
    this.currentSetupPlayerIndex = s.currentSetupPlayerIndex;

    this.racers.forEach((r) => this.world.addChild(r));
    this.holes.forEach((h) => this.world.addChild(h));
  }

  private initNewRace(names: string[], keys?: string[]) {
    const results = createRacers(names, this.characterAnimations, keys);
    results.forEach(({ racer, characterKey }) => {
      this.racers.push(racer);
      this.racerCharacters.set(racer, characterKey);
      if (!this.isFunnyMode) this.world.addChild(racer);
    });
    if (!this.isFunnyMode) {
      const indices = this.racers.map((_, i) => i).sort(() => Math.random() - 0.5);
      this.racers.forEach((r, i) => (r.laneIndex = indices[i]));
    }
  }

  /**
   * Detach the objects that outlive a layout (racers, holes) so the layout itself
   * can be fully destroyed on an orientation change.
   */
  public detachPersistentObjects() {
    this.racers.forEach((r) => r.removeFromParent());
    this.holes.forEach((h) => h.removeFromParent());
    this.funnyModeManager?.getProgress()?.holes.forEach((h) => h.removeFromParent());
  }

  public getState(): RaceState {
    // Mid-setup, the traps placed so far live in the funny-mode manager
    const setup = this.funnyModeManager?.getProgress() ?? null;
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
      targetMusicVolume: this.targetMusicVolume,
      holes: setup ? setup.holes : this.holes,
      setupPhase: this.setupPhase,
      setupFinished: this.setupFinished,
      currentSetupPlayerIndex: setup ? setup.playerIndex : this.currentSetupPlayerIndex,
    };
  }

  /**
   * Racers in the order the leaderboard should show them (lane order before the start).
   * Neck-and-neck racers only swap places on the board once one is clearly ahead,
   * so the cards don't reshuffle on every pixel of jitter.
   */
  protected getLeaderboardOrder(): Racer[] {
    if (!this.raceStarted) return [...this.racers].sort((a, b) => a.laneIndex - b.laneIndex);

    const active = this.racers.filter((r) => !r.isFinished());
    const kept = this.boardOrder.filter((r) => !r.isFinished());
    const order = kept.length === active.length ? kept : active.sort((a, b) => b.x - a.x);
    for (let pass = 0; pass < order.length; pass++) {
      let swapped = false;
      for (let i = 0; i < order.length - 1; i++) {
        if (order[i + 1].x - order[i].x > LEADERBOARD_SWAP_MARGIN_PX) {
          [order[i], order[i + 1]] = [order[i + 1], order[i]];
          swapped = true;
        }
      }
      if (!swapped) break;
    }
    this.boardOrder = [...this.finishedRacers, ...order];
    return this.boardOrder;
  }

  /**
   * Scale racers so the visible character (plus its name label and stamina bar when shown)
   * fits inside a lane, then re-center them in their lanes.
   */
  protected fitRacersToLanes(layout: TrackLayoutData, showLabels: boolean, minScale: number) {
    const artH = RACER.ART_FEET - RACER.ART_TOP;
    // With labels: label above the head (~16px) and stamina bar under the feet (~8px)
    const contentH = showLabels ? artH + 34 : artH + 6;
    const scale = Math.max(minScale, Math.min(1, (layout.laneHeight * 0.92) / contentH));
    this.racers.forEach((r) => {
      r.setMobileMode(!showLabels);
      r.scale.set(scale);
    });
    this.trackManager.repositionRacers(this.racers);
  }

  /**
   * Position and size the "remaining distance" counter.
   * @param onPanel Plain text for the sidebar panel instead of shadowed white text over the track.
   */
  protected placeDistanceText(x: number, y: number, fontSize: number, onPanel = false) {
    const text = this.uiManager.getRemainingDistanceText();
    if (!text) return;
    text.x = x;
    text.y = y;
    setFontSize(text, fontSize);
    text.style.fill = onPanel ? UI.TEXT : UI.WHITE;
    if (onPanel) text.style.dropShadow = false;
  }

  protected setupTracks(layout: TrackLayoutData) {
    this.trackLayout = layout;
    this.trackManager.setup(layout);
    if (this.isFunnyMode) {
      this.holes.forEach((h) => {
        if (h.laneIndex !== -1) h.y = this.trackManager.getLaneCenterY(h.laneIndex);
      });
      if (this.setupPhase && !this.setupFinished && !this.funnyModeManager) {
        this.startFunnyModeSetup();
      } else if (this.funnyModeManager) {
        this.funnyModeManager.resize(layout);
      }
    } else {
      this.holes.forEach((h) => this.world.removeChild(h));
      this.holes = [];
    }
  }

  protected startFunnyModeSetup() {
    this.setupPhase = true;
    this.uiManager.updateDistance(0, false);
    if (!this.trackLayout) return;
    this.funnyModeManager = new FunnyModeManager({
      world: this.world,
      ui: this.ui,
      layout: this.trackLayout,
      trackManager: this.trackManager,
      onSetupFinished: (holes) => this.onFunnyModeSetupFinished(holes),
      // Resume trap placement after an orientation change
      startIndex: this.currentSetupPlayerIndex,
      holes: this.holes,
    });
    this.funnyModeManager.startSetup();
  }

  private onFunnyModeSetupFinished(holes: Hole[]) {
    this.holes = holes;
    this.setupPhase = false;
    this.setupFinished = true;
    this.currentSetupPlayerIndex = this.holes.length;
    this.uiManager.updateDistance(this.distance, true);
    const indices = this.racers.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.racers.forEach((r, i) => {
      r.laneIndex = indices[i];
      r.x = -100;
      this.world.addChild(r);
    });
    this.trackManager.repositionRacers(this.racers);
    this.entranceFinished = false;
    this.raceStarted = false;
  }

  public abstract resize(width: number, height: number): void;
  protected abstract updateLeaderboard(delta: number): void;

  update(delta: number) {
    this.handleMusicFade(delta);
    if (this.setupPhase || this.raceEnded) return;
    if (this.isFunnyMode && !this.setupFinished && !this.setupPhase && !this.raceStarted) {
      this.startFunnyModeSetup();
      return;
    }

    if (!this.entranceFinished) {
      let allAtStart = true;
      this.racers.forEach((r) => {
        if (!r.walkEntrance(TRACK.START_LINE_X, delta)) allAtStart = false;
      });
      if (allAtStart) {
        this.entranceFinished = true;
        this.uiManager.updateCountdown(this.countdownTimer, true);
      }
    } else if (!this.raceStarted) {
      this.countdownTimer -= delta / 60;
      if (this.countdownTimer <= 0) this.startRace();
      else this.uiManager.updateCountdown(this.countdownTimer, true);
    } else {
      this.updateRace(delta);
    }
    this.updateLeaderboard(delta);
    this.updateCamera(delta);
    if (this.racers.length > 0 && this.racers.every((r) => r.isFinished())) this.endRace();
  }

  private handleMusicFade(delta: number) {
    if (!this.musicInstance) return;
    if (this.currentMusicVolume !== this.targetMusicVolume) {
      const step = delta * 0.015;
      this.currentMusicVolume =
        this.currentMusicVolume < this.targetMusicVolume
          ? Math.min(this.targetMusicVolume, this.currentMusicVolume + step)
          : Math.max(this.targetMusicVolume, this.currentMusicVolume - step);
      this.musicInstance.volume = this.currentMusicVolume;
      if (this.raceEnded && this.currentMusicVolume <= 0) {
        this.musicInstance.stop();
        this.musicInstance = null;
      }
    }
  }

  private startRace() {
    this.raceStarted = true;
    const musicPromise = sound.play("sound", { loop: true, volume: 0 });
    const setMusic = (instance: IMediaInstance) => {
      this.musicInstance = instance;
      this.targetMusicVolume = 1;
      this.currentMusicVolume = 0;
    };
    if (musicPromise instanceof Promise) musicPromise.then(setMusic);
    else setMusic(musicPromise);
    this.uiManager.updateCountdown(0, true, "GO!");
    setTimeout(() => this.uiManager.updateCountdown(0, false), 1000);
  }

  private updateRace(delta: number) {
    this.elapsedTime += delta;
    if (!this.trackLayout) return;
    const { finishLineX } = this.trackLayout;
    if (this.isFunnyMode) {
      this.updateHoleCollisions(
        this.racers.filter((r) => !r.isFinished()),
        delta,
      );
    }
    stepRace(
      this.racers,
      this.finishedRacers,
      this.elapsedTime,
      delta,
      finishLineX,
      finishLineX - TRACK.START_LINE_X,
    );
    const active = this.racers.filter((r) => !r.isFinished());
    const leaderX = active.length > 0 ? Math.max(...active.map((r) => r.x)) : finishLineX;
    const distM = Math.ceil(Math.max(0, finishLineX - leaderX) / TRACK.PX_PER_METER);
    this.uiManager.updateDistance(distM, true);
  }

  /**
   * Pack camera: frames the leader and the chasing pack together when they fit,
   * otherwise keeps the leader near the right edge so the chasers stay in shot.
   */
  protected updateCamera(delta: number) {
    if (!this.trackLayout || this.racers.length === 0) return;
    const active = this.racers.filter((r) => !r.isFinished());
    const group = active.length > 0 ? active : this.racers;
    let lead = -Infinity;
    let last = Infinity;
    for (const r of group) {
      lead = Math.max(lead, r.x);
      last = Math.min(last, r.x);
    }

    const view = this.gameViewW;
    const pad = Math.max(VISUALS.CAMERA_LEAD_PAD_MIN, view * VISUALS.CAMERA_LEAD_PAD_FRACTION);
    const target = lead - last + pad * 2 <= view ? (lead + last) / 2 - view / 2 : lead + pad - view;
    const targetX = Math.max(0, Math.min(target, this.trackLayout.trackWidth - view));

    const camX = -this.world.x;
    const ease = this.cameraSnapped ? 1 - Math.pow(1 - VISUALS.CAMERA_SMOOTHING, delta) : 1;
    this.world.x = -(camX + (targetX - camX) * ease);
    this.cameraSnapped = true;
  }

  private updateHoleCollisions(active: Racer[], delta: number) {
    const fadeDuration = GAMEPLAY.HOLE_ANIMATION.SINK_DURATION;
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const h = this.holes[i];
      if (h.fading) {
        h.fadeTimer -= delta;
        if (h.fadeTimer <= 0) {
          this.world.removeChild(h);
          this.holes.splice(i, 1);
        }
        continue;
      }
      for (const r of active) {
        if (Math.abs(r.x - h.x) < 10 && (r.laneIndex === h.laneIndex || Math.abs(r.y - h.y) < 10)) {
          r.applyHoleEffect();
          h.fading = true;
          h.fadeTimer = fadeDuration;
          h.zIndex = 1000;
          break;
        }
      }
    }
  }

  protected endRace() {
    this.raceEnded = true;
    this.targetMusicVolume = 0;
    setTimeout(() => this.onFinished(this.finishedRacers), VISUALS.RESULT_DELAY);
  }
}
