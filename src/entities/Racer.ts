import { Container, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { RACER, GAMEPLAY } from "../config";
import type { RacerAnimations } from "../core";
import type { StrategyBehavior, RacerStrategy } from "../strategies";
import { RacerStamina } from "./racer/RacerStamina";
import { RacerDrama } from "./racer/RacerDrama";
import { RacerMovement } from "./racer/RacerMovement";
import { RacerEffects } from "./racer/RacerEffects";
import { calculatePaceModifiers } from "./racer/ComebackEngine";

export type { RacerAnimations, RacerStrategy };

const HOLE_PHASE_NONE = 0;
const HOLE_PHASE_SINKING = 1;
const HOLE_PHASE_HIDDEN = 2;
const HOLE_PHASE_RECOVERING = 3;

export interface RacerStats {
  accel: number;
  topSpeed: number;
  endurance: number;
}

/** Everything a racer needs to know about the race for one frame. */
export interface RaceFrameContext {
  delta: number;
  leaderX: number;
  finishX: number;
  /** Pixels from the start line to the finish line. */
  totalDist: number;
  rank: number;
  totalRacers: number;
  /** Pixels to the nearest racer ahead, or null when leading. */
  gapAhead: number | null;
}

const STUMBLE_HOP_PX = 10;
const STUMBLE_TILT = 0.2;

export class Racer extends Container {
  public racerName: string;
  public characterKey: string;
  public laneIndex: number = 0;
  public strategy: RacerStrategy;
  public finishTime: number = 0;

  private sprite: AnimatedSprite;
  private animations: RacerAnimations;
  private strategyBehavior: StrategyBehavior;
  private labelText: Text;

  // Components
  private staminaSys: RacerStamina;
  private dramaSys: RacerDrama;
  private moveSys: RacerMovement;
  private fx: RacerEffects;

  // Stats
  public acceleration: number;
  public topSpeed: number;
  public endurance: number;

  private finished: boolean = false;
  private elapsedFrames: number = 0;

  // Hole stun death-sequence state
  private holePhase: number = HOLE_PHASE_NONE;
  private holePhaseTimer: number = 0;
  /** Sprite scale that makes a 48px frame render at RACER.WIDTH — the hole animation scales relative to it. */
  private spriteBaseScale: number = 1;

  // Per-frame pace state (exposed for effects / debugging)
  public isDrafting: boolean = false;
  public isKicking: boolean = false;
  /** Once a racer commits to its final kick it keeps sprinting to the line. */
  private wasKicking: boolean = false;

  constructor(
    name: string,
    y: number,
    stats: RacerStats,
    animations: RacerAnimations,
    charKey: string,
    strategy: StrategyBehavior,
  ) {
    super();
    this.racerName = name;
    this.characterKey = charKey;
    this.acceleration = stats.accel;
    this.topSpeed = stats.topSpeed;
    this.endurance = stats.endurance;
    this.strategyBehavior = strategy;
    this.strategy = strategy.name;
    this.animations = animations;

    this.staminaSys = new RacerStamina(this.endurance, strategy);
    this.addChild(this.staminaSys);

    this.dramaSys = new RacerDrama();
    this.moveSys = new RacerMovement();
    this.fx = new RacerEffects();
    this.addChild(this.fx.back);

    this.sprite = new AnimatedSprite(this.animations.idle);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.width = RACER.WIDTH;
    this.sprite.height = RACER.HEIGHT;
    this.spriteBaseScale = this.sprite.scale.x;
    this.sprite.animationSpeed = 0.1;
    this.sprite.play();
    this.addChild(this.sprite);
    this.addChild(this.fx.front);

    this.labelText = new Text({
      text: name,
      style: new TextStyle({
        fill: "#ffffff",
        fontSize: 13,
        fontWeight: "bold",
        dropShadow: { alpha: 0.5, angle: Math.PI / 6, blur: 2, color: "#000000", distance: 2 },
      }),
    });
    this.labelText.anchor.set(0.5);
    this.labelText.y = RACER.LABEL_Y;
    this.addChild(this.labelText);

    this.x = -100; // Start off-screen
    this.y = y;
  }

  public setMobileMode(isMobile: boolean) {
    this.staminaSys.setVisible(!isMobile);
    this.labelText.visible = !isMobile;
  }

  walkEntrance(targetX: number, delta: number): boolean {
    if (this.x < targetX) {
      this.x += 2 * delta;
      this.moveSys.x = this.x; // Keep moveSys in sync
      this.setAnimation("walk");
      if (this.x >= targetX) {
        this.x = targetX;
        this.moveSys.x = this.x;
        this.setAnimation("idle");
        return true;
      }
      return false;
    }
    this.setAnimation("idle");
    return true;
  }

  private setAnimation(key: keyof RacerAnimations) {
    if (this.sprite.textures === this.animations[key]) return;
    this.sprite.textures = this.animations[key];
    this.sprite.loop = true;
    this.sprite.play();
  }

  update(ctx: RaceFrameContext) {
    const { delta } = ctx;
    if (this.finished) {
      this.setAnimation("idle");
      return;
    }
    this.elapsedFrames += delta;

    // Always update drama system so timers (stumble, stun, second wind) can decrement
    this.dramaSys.update(delta, ctx.rank === 1, (ctx.rank - 1) / Math.max(1, ctx.totalRacers - 1));

    if (this.dramaSys.isStunned()) {
      this.moveSys.targetSpeed = 0;
      this.moveSys.update(delta, 0.1, GAMEPLAY.PHYSICS);
      this.x = this.moveSys.x;
      this.updateHoleSequence(delta);
      return;
    }

    // If we just exited stun, make sure visuals are clean
    if (this.holePhase !== HOLE_PHASE_NONE) {
      this.holePhase = HOLE_PHASE_NONE;
      this.sprite.y = 0;
      this.sprite.alpha = 1;
    }

    const { PHYSICS, EFFORT, DRAMA } = GAMEPLAY;
    const distToFinish = ctx.finishX - this.x;
    const distCovered = ctx.totalDist - distToFinish;
    const raceProgress = Math.min(1, Math.max(0, distCovered / ctx.totalDist));
    // Final kick: go all-in once the line is within reach of the stamina left in the tank
    const sprintReach =
      this.staminaSys.sprintFramesLeft(this.strategyBehavior.traits.drainMult) *
      this.topSpeed *
      EFFORT.SPRINT;
    const inFinalStretch =
      this.staminaSys.isSprinting && this.wasKicking
        ? true
        : distToFinish <= Math.max(PHYSICS.MIN_KICK_PX, sprintReach * PHYSICS.KICK_REACH_MARGIN);
    this.wasKicking = inFinalStretch;

    const mods = calculatePaceModifiers(this, this.strategyBehavior, {
      rank: ctx.rank,
      totalRacers: ctx.totalRacers,
      distFromLeader: ctx.leaderX - this.x,
      gapAhead: ctx.gapAhead,
      totalDistance: ctx.totalDist,
      distCovered,
      inFinalStretch,
      isSprinting: this.staminaSys.isSprinting,
      elapsedFrames: this.elapsedFrames,
      paceFrequency: this.dramaSys.paceFrequency,
      pacePhase: this.dramaSys.pacePhase,
    });
    this.isDrafting = mods.isDrafting;
    this.isKicking = mods.isKicking;

    this.staminaSys.update(delta, mods.recoveryMult, mods.drainMult, raceProgress, inFinalStretch);

    const effort = this.staminaSys.isTired
      ? EFFORT.TIRED
      : this.staminaSys.isSprinting
        ? EFFORT.SPRINT
        : EFFORT.CRUISE;
    // Dropping below half stamina slowly saps top speed, so endurance matters all race long
    const fatigue = 1 - PHYSICS.FATIGUE_FADE * Math.max(0, 1 - this.staminaSys.fraction * 2);
    const secondWind = this.dramaSys.hasSecondWind() ? GAMEPLAY.SECOND_WIND.SPEED_MULT : 1;

    const stumble = this.dramaSys.getStumbleProgress();
    this.moveSys.targetSpeed =
      stumble >= 0
        ? this.topSpeed * DRAMA.STUMBLE_SPEED_FACTOR
        : this.topSpeed * mods.topSpeedMult * secondWind * effort * fatigue;

    this.moveSys.update(delta, mods.effectiveAccel, PHYSICS);
    this.x = this.moveSys.x;

    if (this.moveSys.currentSpeed > 0.5) {
      this.setAnimation("walk");
      this.sprite.animationSpeed = 0.05 + (this.moveSys.currentSpeed / this.topSpeed) * 0.15;
    } else {
      this.setAnimation("idle");
    }

    // Stumble: a little trip-hop with a forward tilt
    const hop = stumble >= 0 ? Math.sin(stumble * Math.PI) : 0;
    this.sprite.y = -hop * STUMBLE_HOP_PX;
    this.sprite.rotation = hop * STUMBLE_TILT;

    this.fx.update(delta, {
      speed: this.moveSys.currentSpeed,
      sprinting: this.staminaSys.isSprinting,
      // Sweat when exhausted, or when digging deep on a nearly empty tank
      tired:
        this.staminaSys.isTired || (this.staminaSys.isSprinting && this.staminaSys.fraction < 0.15),
      drafting: mods.isDrafting,
      kicking: mods.isKicking,
      secondWind: this.dramaSys.hasSecondWind(),
      stumbling: stumble >= 0,
    });
  }

  setFinished(time: number) {
    this.finished = true;
    this.finishTime = time;
    this.staminaSys.setVisible(false);
    this.sprite.y = 0;
    this.sprite.rotation = 0;
    this.fx.clear();
    this.setAnimation("idle");
  }

  isFinished() {
    return this.finished;
  }

  public applyHoleEffect() {
    if (this.finished) return;
    this.moveSys.currentSpeed = 0;
    this.moveSys.targetSpeed = 0;
    this.dramaSys.applyHoleStun();
    this.fx.clear();
    this.sprite.rotation = 0;

    // Start the sink-into-hole sequence
    this.holePhase = HOLE_PHASE_SINKING;
    this.holePhaseTimer = 0;

    // Keep current animation (walk/idle) while sinking
  }

  private updateHoleSequence(delta: number) {
    this.holePhaseTimer += delta;

    switch (this.holePhase) {
      case HOLE_PHASE_SINKING: {
        const { SINK_DURATION, FADE_START_THRESHOLD, SINK_OFFSET_PX } = GAMEPLAY.HOLE_ANIMATION;
        const t = Math.min(this.holePhaseTimer / SINK_DURATION, 1);
        const eased = t * t; // ease-in quad — slow start, fast at end
        const shrink = 1 - eased; // 1 → 0
        this.sprite.scale.set(this.spriteBaseScale * shrink);
        this.sprite.y = eased * SINK_OFFSET_PX;
        // Fade out after sinking past initial depth
        const fadeStart = FADE_START_THRESHOLD;
        this.sprite.alpha = t < fadeStart ? 1 : 1 - (t - fadeStart) / (1 - fadeStart);
        if (this.holePhaseTimer >= SINK_DURATION) {
          this.holePhase = HOLE_PHASE_HIDDEN;
          this.holePhaseTimer = 0;
          this.sprite.visible = false;
          this.sprite.alpha = 0;
        }
        break;
      }
      case HOLE_PHASE_HIDDEN: {
        // Stay invisible for a beat
        if (this.holePhaseTimer >= GAMEPLAY.HOLE_ANIMATION.HIDDEN_DURATION) {
          this.holePhase = HOLE_PHASE_RECOVERING;
          this.holePhaseTimer = 0;
          // Reappear: restore scale, position, switch to idle
          this.sprite.visible = true;
          this.sprite.scale.set(this.spriteBaseScale);
          this.sprite.y = 0;
          this.setAnimation("idle");
        }
        break;
      }
      case HOLE_PHASE_RECOVERING: {
        // Blink alpha rapidly to signal recovery invincibility
        const { FLASH_INTERVAL, FLASH_DURATION } = GAMEPLAY.HOLE_ANIMATION;
        const flashCycle = Math.floor(this.holePhaseTimer / FLASH_INTERVAL);
        this.sprite.alpha = flashCycle % 2 === 0 ? 1.0 : 0.3;
        if (this.holePhaseTimer >= FLASH_DURATION) {
          this.holePhase = HOLE_PHASE_NONE;
          this.sprite.alpha = 1;
        }
        break;
      }
    }
  }

  get stumbleCount() {
    return this.dramaSys.stumbleCount;
  }
  get tiredCount() {
    return this.staminaSys.tiredCount;
  }
}
