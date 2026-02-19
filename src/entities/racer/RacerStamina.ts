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
    this.staminaBarBg.rect(-RACER.WIDTH / 2, 5, RACER.WIDTH, 5);
    this.staminaBarBg.fill({ color: COLORS.STAMINA_BG });
    this.addChild(this.staminaBarBg);

    this.staminaBar = new Graphics();
    this.addChild(this.staminaBar);
    this.updateBar();
  }

  public update(
    delta: number,
    recoveryMult: number,
    raceProgress: number,
    inClimaxPhase: boolean,
    distToFinish: number,
  ) {
    const { PHYSICS } = GAMEPLAY;
    const inSprintZone = distToFinish < PHYSICS.SPRINT_DISTANCE;
    const staminaPct = (this.stamina / this.maxStamina) * 100;

    let shouldSprint = this.strategyBehavior.shouldSprint({
      staminaPct,
      raceProgress,
      inClimaxPhase,
      inSprintZone,
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
    this.isSprinting = shouldSprint;

    const passiveDrain = PHYSICS.PASSIVE_STAMINA_DRAIN / this.endurance;

    if (this.isTired) {
      const recoveryRate = PHYSICS.STAMINA_RECOVERY_RATE * this.endurance * recoveryMult;
      this.stamina = Math.min(this.maxStamina, this.stamina + recoveryRate * delta);
      if (this.stamina >= this.strategyBehavior.tiredExitThreshold(this.maxStamina)) {
        this.isTired = false;
        this.isSprinting = false;
      }
    } else {
      if (this.isSprinting) {
        const depletionRate = PHYSICS.STAMINA_DEPLETION_RATE / this.endurance;
        this.stamina = Math.max(0, this.stamina - (depletionRate + passiveDrain) * delta);
      } else {
        const recoveryRate = PHYSICS.STAMINA_RECOVERY_RATE * this.endurance * recoveryMult;
        this.stamina = Math.min(this.maxStamina, this.stamina + recoveryRate * delta);
      }
      if (this.stamina <= 0) {
        this.isTired = true;
        this.tiredCount++;
        this.isSprinting = false;
      }
    }
    this.updateBar();
  }

  public updateBar() {
    this.staminaBar.clear();
    const width = (this.stamina / this.maxStamina) * RACER.WIDTH;
    const color = this.isTired ? COLORS.STAMINA_TIRED : COLORS.STAMINA_GOOD;
    this.staminaBar.rect(-RACER.WIDTH / 2, 5, width, 5);
    this.staminaBar.fill({ color });
  }

  public setVisible(visible: boolean) {
    this.staminaBar.visible = visible;
    this.staminaBarBg.visible = visible;
  }
}
