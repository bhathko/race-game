import { Container, Graphics } from "pixi.js";
import { sound } from "@pixi/sound";
import type { IMediaInstance } from "@pixi/sound";
import { Racer, Hole } from "../../entities";
import { createRacers } from "../../factories";
import { RACER, TRACK, GAMEPLAY, VISUALS } from "../../config";
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
  protected isPortrait: boolean = false;

  protected entranceFinished: boolean = false;
  protected countdownTimer: number = VISUALS.COUNTDOWN_DURATION;
  protected raceStarted: boolean = false;

  protected musicInstance: IMediaInstance | null = null;
  protected targetMusicVolume: number = 0;
  protected currentMusicVolume: number = 0;

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
      targetMusicVolume: this.targetMusicVolume,
      holes: this.holes,
      setupPhase: this.setupPhase,
      setupFinished: this.setupFinished,
      currentSetupPlayerIndex: this.currentSetupPlayerIndex,
    };
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

    let leaderX = 0;
    if (!this.entranceFinished) {
      let allAtStart = true;
      this.racers.forEach((r) => {
        if (!r.walkEntrance(TRACK.START_LINE_X, delta)) allAtStart = false;
      });
      if (allAtStart) {
        this.entranceFinished = true;
        this.uiManager.updateCountdown(this.countdownTimer, true);
      }
      leaderX = Math.max(0, ...this.racers.map((r) => r.x));
    } else if (!this.raceStarted) {
      this.countdownTimer -= delta / 60;
      if (this.countdownTimer <= 0) this.startRace();
      else this.uiManager.updateCountdown(this.countdownTimer, true);
      leaderX = Math.max(0, ...this.racers.map((r) => r.x));
    } else {
      this.updateRace(delta);
      const active = this.racers.filter((r) => !r.isFinished());
      leaderX =
        active.length > 0
          ? Math.max(...active.map((r) => r.x))
          : Math.max(...this.racers.map((r) => r.x));
    }
    this.updateLeaderboard(delta);
    this.updateCamera(leaderX, delta);
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
    const active = this.racers.filter((r) => !r.isFinished());
    if (this.isFunnyMode) {
      this.updateHoleCollisions(active, delta);
    }
    const ranked = [...active].sort((a, b) => b.x - a.x);
    if (!this.trackLayout) return;
    const totalPx = this.trackLayout.finishLineX - TRACK.START_LINE_X;
    const inClimax = active.some(
      (r) => r.x >= this.trackLayout!.finishLineX - totalPx * GAMEPLAY.BALANCE.CLIMAX_THRESHOLD,
    );
    this.racers.forEach((r) => {
      if (!r.isFinished()) {
        r.update(
          delta,
          this.elapsedTime,
          ranked[0]?.x || 0,
          this.trackLayout!.finishLineX,
          ranked.indexOf(r) + 1 || 1,
          totalPx,
          inClimax,
          active.length,
        );
        if (r.x >= this.trackLayout!.finishLineX - RACER.WIDTH + RACER.COLLISION_OFFSET) {
          r.x = this.trackLayout!.finishLineX - RACER.WIDTH + RACER.COLLISION_OFFSET;
          r.setFinished(this.elapsedTime);
          this.finishedRacers.push(r);
        }
      }
    });
    const distM = Math.ceil(
      (Math.max(0, this.trackLayout.finishLineX - (ranked[0]?.x || this.racers[0].x)) / totalPx) *
        this.distance,
    );
    this.uiManager.updateDistance(distM, true);
  }

  protected updateCamera(leaderX: number, delta: number) {
    if (!this.trackLayout) return;
    const targetX = Math.max(
      0,
      Math.min(leaderX - this.gameViewW / 2, this.trackLayout.trackWidth - this.gameViewW),
    );
    this.world.x = -(
      -this.world.x +
      (targetX - -this.world.x) * (1 - Math.pow(1 - VISUALS.CAMERA_SMOOTHING, delta))
    );
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
        if (
          Math.abs(r.x - h.x) < 10 &&
          (r.laneIndex === h.laneIndex || Math.abs(r.y - h.y) < 10)
        ) {
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
