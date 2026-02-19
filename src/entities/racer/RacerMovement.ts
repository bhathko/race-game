export class RacerMovement {
  public currentSpeed: number = 0;
  public targetSpeed: number = 0;
  public x: number = -100;

  public update(delta: number, effectiveAccel: number, PHYSICS: any) {
    const accelRate =
      this.targetSpeed > this.currentSpeed
        ? effectiveAccel
        : effectiveAccel * PHYSICS.ACCEL_SMOOTHING_FACTOR;
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * (accelRate * delta);

    const moveStep = (this.currentSpeed + (Math.random() - 0.5) * PHYSICS.SPEED_NOISE) * delta;
    this.x += moveStep;
  }

  public reset(startX: number) {
    this.x = startX;
    this.currentSpeed = 0;
    this.targetSpeed = 0;
  }
}
