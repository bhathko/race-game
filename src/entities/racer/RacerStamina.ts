import { Container, Graphics } from "pixi.js";
import { RACER, COLORS, GAMEPLAY } from "../../config";
import type { StrategyBehavior } from "../../strategies";

export class RacerStamina extends Container {
  public stamina: number = 100;
  public maxStamina: number = 100;
  public isTired: boolean = false;
  public isSprinting: boolean = false;
  private staminaAtSprintStart: number = 0;

  private staminaBar: Graphics;
  private staminaBarBg: Graphics;
  private endurance: number;
  private strategyBehavior: StrategyBehavior;

  public tiredCount: number = 0;

  constructor(endurance: number, strategyBehavior: StrategyBehavior) {
    super();
    this.endurance = endurance;
    this.strategyBehavior = strategyBehavior;

    this.staminaBarBg = new Graphics();
    this.y = RACER.STAMINA_BAR_Y;
    this.staminaBarBg.rect(-RACER.STAMINA_BAR_WIDTH / 2, 0, RACER.STAMINA_BAR_WIDTH, 4);
    this.staminaBarBg.fill({ color: COLORS.STAMINA_BG });
    this.addChild(this.staminaBarBg);

    this.staminaBar = new Graphics();
    this.addChild(this.staminaBar);
    this.updateBar();
  }

  public get fraction(): number {
    return this.stamina / this.maxStamina;
  }

  /** How many frames of sprinting the current stamina allows. */
  public sprintFramesLeft(drainMult: number): number {
    if (this.isTired) return 0;
    const { SPRINT_DRAIN, PASSIVE_STAMINA_DRAIN } = GAMEPLAY.PHYSICS;
    return this.stamina / ((SPRINT_DRAIN * drainMult + PASSIVE_STAMINA_DRAIN) / this.endurance);
  }

  public update(
    delta: number,
    recoveryMult: number,
    drainMult: number,
    raceProgress: number,
    inFinalStretch: boolean,
  ) {
    const { PHYSICS } = GAMEPLAY;
    const staminaPct = this.fraction * 100;

    let shouldSprint = this.strategyBehavior.shouldSprint({
      staminaPct,
      raceProgress,
      inFinalStretch,
    });

    // Sprint constraints
    if (!this.isSprinting && shouldSprint && staminaPct < PHYSICS.MIN_SPRINT_START_THRESHOLD)
      shouldSprint = false;
    if (this.isSprinting && !shouldSprint && this.stamina > 0) {
      if (
        ((this.staminaAtSprintStart - this.stamina) / this.maxStamina) * 100 <
        PHYSICS.MIN_SPRINT_USAGE
      )
        shouldSprint = true;
    }

    if (shouldSprint && !this.isSprinting) this.staminaAtSprintStart = this.stamina;
    this.isSprinting = shouldSprint && !this.isTired;

    const recoveryRate = PHYSICS.STAMINA_RECOVERY_RATE * this.endurance * recoveryMult;

    if (this.isTired) {
      // Catching breath: recover faster than normal, but only back to the strategy's threshold
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + recoveryRate * PHYSICS.TIRED_RECOVERY_MULT * delta,
      );
      if (this.stamina >= this.strategyBehavior.tiredExitFraction * this.maxStamina) {
        this.isTired = false;
      }
    } else if (this.isSprinting) {
      const drain =
        (PHYSICS.SPRINT_DRAIN * drainMult + PHYSICS.PASSIVE_STAMINA_DRAIN) / this.endurance;
      this.stamina = Math.max(0, this.stamina - drain * delta);
      if (this.stamina <= 0) {
        this.isTired = true;
        this.tiredCount++;
        this.isSprinting = false;
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + recoveryRate * delta);
    }
    this.updateBar();
  }

  public updateBar() {
    this.staminaBar.clear();
    const width = this.fraction * RACER.STAMINA_BAR_WIDTH;
    const color = this.isTired ? COLORS.STAMINA_TIRED : COLORS.STAMINA_GOOD;
    this.staminaBar.rect(-RACER.STAMINA_BAR_WIDTH / 2, 0, width, 4);
    this.staminaBar.fill({ color });
  }

  public setVisible(visible: boolean) {
    this.staminaBar.visible = visible;
    this.staminaBarBg.visible = visible;
  }
}
