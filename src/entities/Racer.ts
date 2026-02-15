import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { RACER, TRACK, CANVAS, COLORS, GAMEPLAY } from "../config";
import type { RacerAnimations } from "../core/types";

// Re-export so existing imports from Racer still work.
export type { RacerAnimations };

export interface RacerStats {
  accel: number;
  topSpeed: number;
  endurance: number;
}

export class Racer extends Container {
  public racerName: string;
  private sprite: AnimatedSprite;
  private animations: RacerAnimations;

  private currentSpeed: number = 0;
  private targetSpeed: number = 0;
  private finished: boolean = false;
  public finishTime: number = 0;

  // Stats
  public acceleration: number;
  public topSpeed: number;
  public endurance: number;

  // Dynamic State
  private stamina: number = 100;
  private maxStamina: number = 100;
  private isTired: boolean = false;
  private staminaBar: Graphics;

  constructor(
    name: string,
    color: number,
    y: number,
    stats: RacerStats,
    animations: RacerAnimations,
  ) {
    super();
    this.racerName = name;
    this.acceleration = stats.accel;
    this.topSpeed = stats.topSpeed;
    this.endurance = stats.endurance;
    this.animations = animations;

    // Initialize with idle animation
    this.sprite = new AnimatedSprite(this.animations.idle);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.width = RACER.WIDTH;
    this.sprite.height = RACER.HEIGHT;
    this.sprite.animationSpeed = 0.1;
    this.sprite.play();
    this.addChild(this.sprite);

    const barBg = new Graphics();
    barBg.rect(-RACER.WIDTH / 2, 5, RACER.WIDTH, 5);
    barBg.fill(COLORS.STAMINA_BG);
    this.addChild(barBg);

    this.staminaBar = new Graphics();
    this.updateStaminaBar();
    this.addChild(this.staminaBar);

    const labelStyle = new TextStyle({
      fill: color,
      fontSize: 14,
      fontWeight: "bold",
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 6,
        blur: 2,
        color: "#000000",
        distance: 2,
      },
    });
    const label = new Text({ text: name, style: labelStyle });
    label.anchor.set(0.5);
    label.y = -RACER.HEIGHT - 10;
    this.addChild(label);

    this.x = TRACK.START_LINE_X;
    this.y = y + RACER.HEIGHT; // Offset for anchor at bottom
  }

  private updateStaminaBar() {
    this.staminaBar.clear();
    const width = (this.stamina / this.maxStamina) * RACER.WIDTH;
    const color = this.isTired ? COLORS.STAMINA_TIRED : COLORS.STAMINA_GOOD;
    this.staminaBar.rect(-RACER.WIDTH / 2, 5, width, 5);
    this.staminaBar.fill(color);
  }

  private setAnimation(key: keyof RacerAnimations) {
    if (this.sprite.textures === this.animations[key]) return;
    this.sprite.textures = this.animations[key];
    this.sprite.play();
  }

  update(
    delta: number,
    _currentTime: number,
    leaderX: number,
    finishLineX: number,
  ) {
    if (this.finished) {
      this.setAnimation("idle");
      return;
    }

    const distFromLeader = leaderX - this.x;
    const distToFinish = finishLineX - this.x;
    const isLeader = distFromLeader <= 0;

    // Catch-up & Slipstream
    const catchUpBoost = isLeader
      ? 0
      : (distFromLeader / CANVAS.WIDTH) * GAMEPLAY.PHYSICS.CATCH_UP_STRENGTH;
    const slipstreamBoost =
      !isLeader && distFromLeader < GAMEPLAY.PHYSICS.SLIPSTREAM_RANGE
        ? GAMEPLAY.PHYSICS.SLIPSTREAM_BOOST
        : 0;

    // Determine intent: Pacing vs Sprinting
    const inSprintZone = distToFinish < GAMEPLAY.PHYSICS.SPRINT_DISTANCE;
    const shouldSprint =
      inSprintZone ||
      (isLeader && distFromLeader < -50) ||
      (!isLeader && distFromLeader > 100);

    if (this.isTired) {
      const recoveryMultiplier = isLeader ? 0.8 : 1.2;
      const recoveryRate =
        GAMEPLAY.PHYSICS.STAMINA_RECOVERY_RATE *
        this.endurance *
        recoveryMultiplier;
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + recoveryRate * delta,
      );

      this.targetSpeed = this.topSpeed * GAMEPLAY.PHYSICS.TIRED_SPEED_FACTOR;
      if (this.stamina >= GAMEPLAY.PHYSICS.STAMINA_TIRED_THRESHOLD)
        this.isTired = false;
    } else {
      if (shouldSprint) {
        this.targetSpeed =
          this.topSpeed * GAMEPLAY.PHYSICS.SPRINT_SPEED_FACTOR +
          catchUpBoost +
          slipstreamBoost;
        const depletionRate =
          (GAMEPLAY.PHYSICS.STAMINA_DEPLETION_RATE / this.endurance) *
          (isLeader ? 1.1 : 1.0);
        this.stamina = Math.max(0, this.stamina - depletionRate * delta);
      } else {
        this.targetSpeed =
          this.topSpeed * GAMEPLAY.PHYSICS.CRUISING_SPEED_FACTOR + catchUpBoost;
        const recoveryRate =
          GAMEPLAY.PHYSICS.STAMINA_CRUISING_RECOVERY * this.endurance;
        this.stamina = Math.min(
          this.maxStamina,
          this.stamina + recoveryRate * delta,
        );
      }

      if (this.stamina <= 0) this.isTired = true;
    }

    const accelRate =
      this.targetSpeed > this.currentSpeed
        ? this.acceleration
        : this.acceleration * GAMEPLAY.PHYSICS.ACCEL_SMOOTHING_FACTOR;
    this.currentSpeed +=
      (this.targetSpeed - this.currentSpeed) * (accelRate * delta);

    // Update position
    const moveStep =
      (this.currentSpeed +
        (Math.random() - 0.5) * GAMEPLAY.PHYSICS.SPEED_NOISE) *
      delta;
    this.x += moveStep;

    // Update animations based on speed
    if (this.currentSpeed > 0.5) {
      this.setAnimation("walk");
      this.sprite.animationSpeed =
        0.05 + (this.currentSpeed / this.topSpeed) * 0.15;
    } else {
      this.setAnimation("idle");
      this.sprite.animationSpeed = 0.1;
    }

    this.updateStaminaBar();
  }

  setFinished(time: number) {
    this.finished = true;
    this.finishTime = time;
    this.staminaBar.visible = false;
    this.setAnimation("idle");
  }

  isFinished() {
    return this.finished;
  }
}
