import { Container, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { RACER, GAMEPLAY } from "../config";
import type { RacerAnimations } from "../core";
import type { StrategyBehavior, RacerStrategy } from "../strategies";
import { RacerStamina } from "./racer/RacerStamina";
import { RacerDrama } from "./racer/RacerDrama";
import { RacerMovement } from "./racer/RacerMovement";
import { calculateComebackMultipliers } from "./racer/ComebackEngine";

export type { RacerAnimations, RacerStrategy };

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
  public leadFrames: number = 0;

  constructor(
    name: string,
    _color: number,
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

    this.y = y;
  }

  public setMobileMode(isMobile: boolean) {
    this.staminaSys.setVisible(!isMobile);
    this.labelText.visible = !isMobile;
  }

  walkEntrance(targetX: number, delta: number): boolean {
    if (this.x < targetX) {
      this.x += 2 * delta;
      this.setAnimation("walk");
      if (this.x >= targetX) {
        this.x = targetX;
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
    if (this.dramaSys.isStunned()) {
      this.setAnimation("idle");
      return;
    }

    const isLeader = rank === 1;
    if (isLeader) this.leadFrames += delta;

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

    this.dramaSys.update(delta, isLeader, (rank - 1) / Math.max(1, totalRacers - 1));
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
    this.setAnimation("idle");
  }

  // Getters for proxying component state if needed
  get x() {
    return this.moveSys.x;
  }
  set x(val: number) {
    this.moveSys.x = val;
  }
  get stumbleCount() {
    return this.dramaSys.stumbleCount;
  }
  get tiredCount() {
    return this.staminaSys.tiredCount;
  }
}
