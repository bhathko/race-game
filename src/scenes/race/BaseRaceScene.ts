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
  protected trackWidth: number = 0;
  protected finishLineX: number = 0;

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
    this.setupFinished = true;
    this.racers.forEach((r) => this.world.addChild(r));
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
    };
  }

  protected setupTracks() {
    this.trackManager.setup(
      this.trackWidth,
      this.gameViewW,
      this.gameViewH,
      this.finishLineX,
      this.racers.length,
      this.distance,
    );
    if (!this.isFunnyMode) {
      this.holes.forEach((h) => this.world.removeChild(h));
      this.holes = [];
      const totalDistPx = this.finishLineX - TRACK.START_LINE_X;
      for (let i = 0; i < this.racers.length; i++) {
        const hole = new Hole();
        hole.x = TRACK.START_LINE_X + (0.2 + Math.random() * 0.6) * totalDistPx;
        hole.y = this.trackManager.getLaneRacerY(i, this.gameViewH, this.racers.length);
        hole.laneIndex = i;
        this.holes.push(hole);
        this.world.addChild(hole);
        this.world.setChildIndex(hole, this.world.getChildIndex(this.trackManager) + 1);
      }
    } else {
      this.holes.forEach((h) => {
        if (h.laneIndex !== -1)
          h.y = this.trackManager.getLaneRacerY(h.laneIndex, this.gameViewH, this.racers.length);
      });
    }
  }

  protected startFunnyModeSetup() {
    this.setupPhase = true;
    this.uiManager.updateDistance(0, false);
    this.funnyModeManager = new FunnyModeManager({
      world: this.world,
      ui: this.ui,
      gameViewW: this.gameViewW,
      gameViewH: this.gameViewH,
      trackWidth: this.trackWidth,
      finishLineX: this.finishLineX,
      racerCount: this.racers.length,
      onSetupFinished: (holes) => this.onFunnyModeSetupFinished(holes),
    });
    this.funnyModeManager.startSetup();
  }

  private onFunnyModeSetupFinished(holes: Hole[]) {
    this.holes = holes;
    this.setupPhase = false;
    this.setupFinished = true;
    this.uiManager.updateDistance(this.distance, true);
    const indices = this.racers.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.racers.forEach((r, i) => {
      r.laneIndex = indices[i];
      r.x = -100;
      this.world.addChild(r);
    });
    this.trackManager.repositionRacers(this.racers, this.gameViewH);
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
      for (let i = this.holes.length - 1; i >= 0; i--) {
        const h = this.holes[i];
        for (const r of active) {
          if (
            Math.abs(r.x - h.x) < 50 &&
            (r.laneIndex === h.laneIndex || Math.abs(r.y - h.y) < 10)
          ) {
            r.applyHoleEffect();
            this.world.removeChild(h);
            this.holes.splice(i, 1);
            break;
          }
        }
      }
    }
    const ranked = [...active].sort((a, b) => b.x - a.x);
    const totalPx = this.finishLineX - TRACK.START_LINE_X;
    const inClimax = active.some(
      (r) => r.x >= this.finishLineX - totalPx * GAMEPLAY.BALANCE.CLIMAX_THRESHOLD,
    );
    this.racers.forEach((r) => {
      if (!r.isFinished()) {
        r.update(
          delta,
          this.elapsedTime,
          ranked[0]?.x || 0,
          this.finishLineX,
          ranked.indexOf(r) + 1 || 1,
          totalPx,
          inClimax,
          active.length,
        );
        if (r.x >= this.finishLineX - RACER.WIDTH + RACER.COLLISION_OFFSET) {
          r.x = this.finishLineX - RACER.WIDTH + RACER.COLLISION_OFFSET;
          r.setFinished(this.elapsedTime);
          this.finishedRacers.push(r);
        }
      }
    });
    const distM = Math.ceil(
      (Math.max(0, this.finishLineX - (ranked[0]?.x || this.racers[0].x)) / totalPx) *
        this.distance,
    );
    this.uiManager.updateDistance(distM, true);
    this.updateLeaderboard(delta);
  }

  protected updateCamera(leaderX: number, delta: number) {
    const targetX = Math.max(
      0,
      Math.min(leaderX - this.gameViewW / 2, this.trackWidth - this.gameViewW),
    );
    this.world.x = -(
      -this.world.x +
      (targetX - -this.world.x) * (1 - Math.pow(1 - VISUALS.CAMERA_SMOOTHING, delta))
    );
  }

  protected endRace() {
    this.raceEnded = true;
    this.targetMusicVolume = 0;
    setTimeout(() => this.onFinished(this.finishedRacers), VISUALS.RESULT_DELAY);
  }
}
