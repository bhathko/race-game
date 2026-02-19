import { GAMEPLAY } from "../../config";

export class RacerDrama {
  public paceFrequency: number;
  public pacePhase: number;
  public stumbleTimer: number = 0;
  public holeStunTimer: number = 0;
  public trailingFrames: number = 0;
  public secondWindTimer: number = 0;
  public secondWindCooldown: number = 0;
  public stumbleCount: number = 0;

  constructor() {
    const { DRAMA } = GAMEPLAY;
    this.paceFrequency =
      DRAMA.PACE_WAVE_FREQ_MIN +
      Math.random() * (DRAMA.PACE_WAVE_FREQ_MAX - DRAMA.PACE_WAVE_FREQ_MIN);
    this.pacePhase = Math.random() * Math.PI * 2;
  }

  public update(delta: number, isLeader: boolean, normalizedRank: number) {
    const { DRAMA, SECOND_WIND } = GAMEPLAY;

    // Stumble
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= delta;
    } else {
      const chance = DRAMA.STUMBLE_CHANCE * (isLeader ? DRAMA.STUMBLE_LEADER_MULT : 1);
      if (Math.random() < chance * delta) {
        this.stumbleCount++;
        this.stumbleTimer =
          DRAMA.STUMBLE_DURATION_MIN +
          Math.random() * (DRAMA.STUMBLE_DURATION_MAX - DRAMA.STUMBLE_DURATION_MIN);
      }
    }

    // Hole stun
    if (this.holeStunTimer > 0) this.holeStunTimer -= delta;

    // Second Wind
    if (this.secondWindCooldown > 0) this.secondWindCooldown -= delta;
    if (normalizedRank >= SECOND_WIND.TRAILING_THRESHOLD) {
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
      if (this.secondWindTimer <= 0) this.secondWindCooldown = SECOND_WIND.COOLDOWN;
    }
  }

  public getStumbleSpeedFactor(): number {
    return this.stumbleTimer > 0 ? GAMEPLAY.DRAMA.STUMBLE_SPEED_FACTOR : 1;
  }

  public getSecondWindSpeedFactor(): number {
    return this.secondWindTimer > 0 ? GAMEPLAY.SECOND_WIND.SPEED_MULT : 1;
  }

  public isStunned(): boolean {
    return this.holeStunTimer > 0;
  }

  public applyHoleStun() {
    this.holeStunTimer = 60;
  }
}
