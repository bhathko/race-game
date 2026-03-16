import { Container, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { RACER, GAMEPLAY } from "../config";
import type { RacerAnimations } from "../core";
import type { StrategyBehavior, RacerStrategy } from "../strategies";
import { RacerStamina } from "./racer/RacerStamina";
import { RacerDrama } from "./racer/RacerDrama";
import { RacerMovement } from "./racer/RacerMovement";
import { calculateComebackMultipliers } from "./racer/ComebackEngine";

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

  // Stats
  public acceleration: number;
  public topSpeed: number;
  public endurance: number;

  private finished: boolean = false;
  private elapsedFrames: number = 0;

  // Hole stun death-sequence state
  private holePhase: number = HOLE_PHASE_NONE;
  private holePhaseTimer: number = 0;
  private baseSpriteY: number = 0;
  public leadFrames: number = 0;

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

    this.sprite = new AnimatedSprite(this.animations.idle);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.width = RACER.WIDTH;
    this.sprite.height = RACER.HEIGHT;
    this.sprite.animationSpeed = 0.1;
    this.sprite.play();
    this.addChild(this.sprite);

    this.labelText = new Text({
      text: name,
      style: new TextStyle({
        fill: "#ffffff",
        fontSize: 14,
        fontWeight: "bold",
        dropShadow: { alpha: 0.5, angle: Math.PI / 6, blur: 2, color: "#000000", distance: 2 },
      }),
    });
    this.labelText.anchor.set(0.5);
    this.labelText.y = -RACER.HEIGHT - 10;
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

  update(
    delta: number,
    _time: number,
    leaderX: number,
    finishX: number,
    rank: number,
    totalDist: number,
    inClimax: boolean,
    totalRacers: number,
  ) {
    if (this.finished) {
      this.setAnimation("idle");
      return;
    }
    this.elapsedFrames += delta;

    const isLeader = rank === 1;
    if (isLeader) this.leadFrames += delta;

    // Always update drama system so timers (stumble, stun, second wind) can decrement
    this.dramaSys.update(delta, isLeader, (rank - 1) / Math.max(1, totalRacers - 1));

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
      this.sprite.y = this.baseSpriteY;
      this.sprite.alpha = 1;
    }

    const mults = calculateComebackMultipliers(this, {
      rank,
      totalRacers,
      distFromLeader: leaderX - this.x,
      totalDistance: totalDist,
      inClimaxPhase: inClimax,
      elapsedFrames: this.elapsedFrames,
      paceFrequency: this.dramaSys.paceFrequency,
      pacePhase: this.dramaSys.pacePhase,
    });

    this.staminaSys.update(
      delta,
      mults.recoveryMult,
      1 - (finishX - this.x) / totalDist,
      inClimax,
      finishX - this.x,
    );

    let baseTopSpeed = mults.effectiveTopSpeed * this.dramaSys.getSecondWindSpeedFactor();

    if (this.staminaSys.isTired) {
      this.moveSys.targetSpeed = baseTopSpeed * this.strategyBehavior.tiredSpeedFactor();
    } else {
      const factor = this.staminaSys.isSprinting
        ? GAMEPLAY.PHYSICS.SPRINT_SPEED_FACTOR
        : GAMEPLAY.PHYSICS.CRUISING_SPEED_FACTOR;
      this.moveSys.targetSpeed = baseTopSpeed * factor;
    }

    if (this.dramaSys.stumbleTimer > 0)
      this.moveSys.targetSpeed = baseTopSpeed * GAMEPLAY.DRAMA.STUMBLE_SPEED_FACTOR;

    this.moveSys.update(delta, mults.effectiveAccel, GAMEPLAY.PHYSICS);
    this.x = this.moveSys.x;

    if (this.moveSys.currentSpeed > 0.5) {
      this.setAnimation("walk");
      this.sprite.animationSpeed = 0.05 + (this.moveSys.currentSpeed / this.topSpeed) * 0.15;
    } else {
      this.setAnimation("idle");
    }
  }

  setFinished(time: number) {
    this.finished = true;
    this.finishTime = time;
    this.staminaSys.setVisible(false);
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

    // Start the sink-into-hole sequence
    this.holePhase = HOLE_PHASE_SINKING;
    this.holePhaseTimer = 0;
    this.baseSpriteY = this.sprite.y;

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
        this.sprite.scale.set(shrink);
        this.sprite.y = this.baseSpriteY + eased * SINK_OFFSET_PX;
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
          this.sprite.scale.set(1);
          this.sprite.y = this.baseSpriteY;
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
