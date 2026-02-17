import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { RACER, COLORS, GAMEPLAY } from "../config";
import type { RacerAnimations } from "../core/types";
import type {
  StrategyBehavior,
  RacerStrategy,
} from "../strategies/StrategyBehavior";

// Re-export so external modules can reference the types.
export type { RacerAnimations, RacerStrategy };

export interface RacerStats {
  accel: number;
  topSpeed: number;
  endurance: number;
}

export class Racer extends Container {
  public racerName: string;
  public characterKey: string;
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
  public strategy: RacerStrategy;
  private strategyBehavior: StrategyBehavior;

  // Dynamic State
  private stamina: number = 100;
  private maxStamina: number = 100;
  private isTired: boolean = false;
  private isSprinting: boolean = false;
  private staminaAtSprintStart: number = 0;
  private staminaBar: Graphics;
  private staminaBarBg: Graphics;
  private labelText: Text;

  // Drama — pace wave (unique per racer)
  private paceFrequency: number;
  private pacePhase: number;

  // Drama — stumble
  private stumbleTimer: number = 0;

  // Second Wind — burst for deeply trailing racers
  private trailingFrames: number = 0;
  private secondWindTimer: number = 0;
  private secondWindCooldown: number = 0;

  // Frame counter for wave functions
  private elapsedFrames: number = 0;

  // Runtime tracking (exposed for logging)
  public stumbleCount: number = 0;
  public tiredCount: number = 0;
  public leadFrames: number = 0;

  constructor(
    name: string,
    _color: number,
    y: number,
    stats: RacerStats,
    animations: RacerAnimations,
    characterKey: string,
    strategy: StrategyBehavior,
  ) {
    super();
    this.racerName = name;
    this.characterKey = characterKey;
    this.acceleration = stats.accel;
    this.topSpeed = stats.topSpeed;
    this.endurance = stats.endurance;
    this.strategyBehavior = strategy;
    this.strategy = strategy.name;
    this.animations = animations;

    // Each racer gets a unique pace-wave frequency and phase offset
    const { DRAMA } = GAMEPLAY;
    this.paceFrequency =
      DRAMA.PACE_WAVE_FREQ_MIN +
      Math.random() * (DRAMA.PACE_WAVE_FREQ_MAX - DRAMA.PACE_WAVE_FREQ_MIN);
    this.pacePhase = Math.random() * Math.PI * 2;

    // Initialize with idle animation
    this.sprite = new AnimatedSprite(this.animations.idle);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.width = RACER.WIDTH;
    this.sprite.height = RACER.HEIGHT;
    this.sprite.animationSpeed = 0.1;
    this.sprite.play();
    this.addChild(this.sprite);

    this.staminaBarBg = new Graphics();
    this.staminaBarBg.rect(-RACER.WIDTH / 2, 5, RACER.WIDTH, 5);
    this.staminaBarBg.fill({ color: COLORS.STAMINA_BG });
    this.addChild(this.staminaBarBg);

    this.staminaBar = new Graphics();
    this.updateStaminaBar();
    this.addChild(this.staminaBar);

    const labelStyle = new TextStyle({
      fill: "#ffffff",
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
    this.labelText = new Text({ text: name, style: labelStyle });
    this.labelText.anchor.set(0.5);
    this.labelText.y = -RACER.HEIGHT - 10;
    this.addChild(this.labelText);

    this.x = -100; // Start off-screen for entrance
    this.y = y + RACER.HEIGHT; // Offset for anchor at bottom
  }

  /** Hide specific UI elements for mobile view. */
  public setMobileMode(isMobile: boolean) {
    this.staminaBar.visible = !isMobile;
    this.staminaBarBg.visible = !isMobile;
    this.labelText.visible = !isMobile;
  }

  /**
   * Pre-race entrance logic.
   * @returns true if racer has reached targetX
   */
  walkEntrance(targetX: number, delta: number): boolean {
    const entranceSpeed = 2;
    if (this.x < targetX) {
      this.x += entranceSpeed * delta;
      this.setAnimation("walk");
      this.sprite.animationSpeed = 0.15;
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

  private updateStaminaBar() {
    this.staminaBar.clear();
    const width = (this.stamina / this.maxStamina) * RACER.WIDTH;
    const color = this.isTired ? COLORS.STAMINA_TIRED : COLORS.STAMINA_GOOD;
    this.staminaBar.rect(-RACER.WIDTH / 2, 5, width, 5);
    this.staminaBar.fill({ color });
  }

  private setAnimation(key: keyof RacerAnimations) {
    if (this.sprite.textures === this.animations[key]) return;
    this.sprite.textures = this.animations[key];
    this.sprite.play();
  }

  /**
   * Per-frame update implementing the "Comeback Engine" from documents/spec.md.
   *
   * All rank-based multipliers use a continuous normalised rank
   *   t = (rank − 1) / max(1, totalRacers − 1)
   * so they scale identically for 2-player and 8-player races.
   *
   * @param delta          Frame delta (ticker.deltaTime)
   * @param _currentTime   Elapsed race time (unused, kept for API compat)
   * @param leaderX        X position of the current leader
   * @param finishLineX    X position of the finish line
   * @param rank           This racer's current position (1 = leader)
   * @param totalDistance   Total race distance in pixels (start → finish)
   * @param inClimaxPhase  Whether *any* racer has entered the final 20 %
   * @param totalRacers    Number of active racers in this race
   */
  update(
    delta: number,
    _currentTime: number,
    leaderX: number,
    finishLineX: number,
    rank: number = 1,
    totalDistance: number = 1,
    inClimaxPhase: boolean = false,
    totalRacers: number = 2,
  ) {
    if (this.finished) {
      this.setAnimation("idle");
      return;
    }

    this.elapsedFrames += delta;

    const { BALANCE, PHYSICS, DRAMA } = GAMEPLAY;

    // ── Continuous normalised rank  t ∈ [0, 1]  (0 = leader, 1 = last) ─
    const t = (rank - 1) / Math.max(1, totalRacers - 1);
    const distToFinish = finishLineX - this.x;
    const distFromLeader = leaderX - this.x;
    const isLeader = rank === 1;
    if (isLeader) this.leadFrames += delta;

    // ── §3-A  Slingshot — acceleration multiplier ──────────────────────
    const effectiveAccel =
      this.acceleration * (1 + t * BALANCE.ACCEL_RANK_FACTOR);

    // ── §3-B  Slipstream — max-speed multiplier ────────────────────────
    let slipstreamMult = 1 + t * (BALANCE.SLIPSTREAM_MAX_MULT - 1);

    // ── Deep-trailing boost — quadratic extra for bottom half ───────────
    if (t > 0.5) {
      const deepTrail = (t - 0.5) * 2; // 0 at mid, 1 at last
      slipstreamMult += deepTrail * deepTrail * BALANCE.DEEP_TRAILING_BOOST;
    }
    let effectiveTopSpeed = this.topSpeed * slipstreamMult;

    // ── Accel-responsiveness — high acceleration = direct speed bonus ──
    const accelNorm = Math.min(
      1,
      Math.max(
        0,
        (this.acceleration - GAMEPLAY.STATS.ACCEL_BASE) /
          GAMEPLAY.STATS.ACCEL_VARIANCE,
      ),
    );
    effectiveTopSpeed *= 1 + accelNorm * BALANCE.ACCEL_SPEED_BONUS;

    // ── Rubber-band — distance-proportional speed boost ────────────────
    if (!isLeader && distFromLeader > 0 && totalDistance > 0) {
      const rubberBandMult =
        1 + (distFromLeader / totalDistance) * BALANCE.RUBBER_BAND_FACTOR;
      effectiveTopSpeed *= rubberBandMult;
    }

    // ── Drama: Pace wave — sinusoidal speed oscillation ────────────────
    const waveValue = Math.sin(
      this.elapsedFrames * this.paceFrequency + this.pacePhase,
    );
    effectiveTopSpeed *= 1 + DRAMA.PACE_WAVE_AMPLITUDE * waveValue;

    // ── §4  Climax Phase — Overdrive ───────────────────────────────────
    if (inClimaxPhase && rank > 1) {
      const eligibleRanks = Math.ceil(
        totalRacers * BALANCE.CLIMAX_OVERDRIVE_RANK_FRAC,
      );
      if (rank <= eligibleRanks) {
        const overdriveRangePx =
          (BALANCE.CLIMAX_OVERDRIVE_RANGE / 50) * totalDistance;
        if (distFromLeader > 0 && distFromLeader <= overdriveRangePx) {
          effectiveTopSpeed *= BALANCE.CLIMAX_OVERDRIVE_SPEED_MULT;
        }
      }
    }

    // ── §3-C  Respite — stamina recovery multiplier ────────────────────
    let recoveryMult = 1 + t * (BALANCE.RECOVERY_MULT_MAX - 1);
    if (inClimaxPhase) recoveryMult *= BALANCE.CLIMAX_RECOVERY_MULT;

    // ── Drama: Stumble — random momentary slowdown ─────────────────────
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= delta;
    } else {
      // Roll for a new stumble
      const stumbleChance =
        DRAMA.STUMBLE_CHANCE * (isLeader ? DRAMA.STUMBLE_LEADER_MULT : 1);
      if (Math.random() < stumbleChance * delta) {
        this.stumbleCount++;
        this.stumbleTimer =
          DRAMA.STUMBLE_DURATION_MIN +
          Math.random() *
            (DRAMA.STUMBLE_DURATION_MAX - DRAMA.STUMBLE_DURATION_MIN);
      }
    }

    // ── Second Wind — burst for deeply trailing racers ─────────────────
    const { SECOND_WIND } = GAMEPLAY;
    if (this.secondWindCooldown > 0) this.secondWindCooldown -= delta;
    if (t >= SECOND_WIND.TRAILING_THRESHOLD) {
      this.trailingFrames += delta;
    } else {
      this.trailingFrames = 0;
    }
    if (
      this.secondWindTimer <= 0 &&
      this.secondWindCooldown <= 0 &&
      this.trailingFrames >= SECOND_WIND.FRAMES_REQUIRED
    ) {
      this.secondWindTimer = SECOND_WIND.DURATION;
      this.trailingFrames = 0;
    }
    if (this.secondWindTimer > 0) {
      this.secondWindTimer -= delta;
      effectiveTopSpeed *= SECOND_WIND.SPEED_MULT;
      if (this.secondWindTimer <= 0) {
        this.secondWindCooldown = SECOND_WIND.COOLDOWN;
      }
    }

    // ── Sprint intent (strategy-based) ─────────────────────────────────
    const inSprintZone = distToFinish < PHYSICS.SPRINT_DISTANCE;
    const staminaPct = (this.stamina / this.maxStamina) * 100;
    const raceProgress = 1 - distToFinish / totalDistance;

    let shouldSprint = this.strategyBehavior.shouldSprint({
      staminaPct,
      raceProgress,
      inClimaxPhase,
      inSprintZone,
    });

    // Engine Rule 1: Cannot START a sprint if below threshold
    if (
      !this.isSprinting &&
      shouldSprint &&
      staminaPct < PHYSICS.MIN_SPRINT_START_THRESHOLD
    ) {
      shouldSprint = false;
    }

    // Engine Rule 2: If already sprinting, must use at least MIN_SPRINT_USAGE % unless at 0
    if (this.isSprinting && !shouldSprint && this.stamina > 0) {
      const usageSoFar =
        ((this.staminaAtSprintStart - this.stamina) / this.maxStamina) * 100;
      if (usageSoFar < PHYSICS.MIN_SPRINT_USAGE) {
        shouldSprint = true; // Force continued sprint
      }
    }

    // Track start of a new sprint
    if (shouldSprint && !this.isSprinting) {
      this.staminaAtSprintStart = this.stamina;
    }
    this.isSprinting = shouldSprint;

    // ── Passive stamina drain (always ticking, endurance-scaled) ───────
    const passiveDrain = PHYSICS.PASSIVE_STAMINA_DRAIN / this.endurance;

    // ── §2  Depletion Rule — Recovery State (V_max × tiredFactor until threshold) ──
    if (this.isTired) {
      const recoveryRate =
        PHYSICS.STAMINA_RECOVERY_RATE * this.endurance * recoveryMult;
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + recoveryRate * delta,
      );
      this.targetSpeed =
        effectiveTopSpeed * this.strategyBehavior.tiredSpeedFactor();
      if (
        this.stamina >=
        this.strategyBehavior.tiredExitThreshold(this.maxStamina)
      ) {
        this.isTired = false;
        this.isSprinting = false;
      }
    } else {
      if (shouldSprint) {
        this.targetSpeed = effectiveTopSpeed * PHYSICS.SPRINT_SPEED_FACTOR;
        const depletionRate = PHYSICS.STAMINA_DEPLETION_RATE / this.endurance;
        this.stamina = Math.max(
          0,
          this.stamina - (depletionRate + passiveDrain) * delta,
        );
      } else {
        this.targetSpeed = effectiveTopSpeed * PHYSICS.CRUISING_SPEED_FACTOR;
        const recoveryRate =
          PHYSICS.STAMINA_RECOVERY_RATE * this.endurance * recoveryMult;
        this.stamina = Math.min(
          this.maxStamina,
          this.stamina + recoveryRate * delta,
        );
      }
      if (this.stamina <= 0) {
        this.isTired = true;
        this.tiredCount++;
        this.isSprinting = false;
      }
    }

    // Override target speed when stumbling
    if (this.stumbleTimer > 0) {
      this.targetSpeed = effectiveTopSpeed * DRAMA.STUMBLE_SPEED_FACTOR;
    }

    // ── Smoothed speed change ──────────────────────────────────────────
    const accelRate =
      this.targetSpeed > this.currentSpeed
        ? effectiveAccel
        : effectiveAccel * PHYSICS.ACCEL_SMOOTHING_FACTOR;
    this.currentSpeed +=
      (this.targetSpeed - this.currentSpeed) * (accelRate * delta);

    // Update position
    const moveStep =
      (this.currentSpeed + (Math.random() - 0.5) * PHYSICS.SPEED_NOISE) * delta;
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
