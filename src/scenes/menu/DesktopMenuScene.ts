import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";

export class DesktopMenuScene extends BaseMenuScene {
  public resize(width: number, height: number) {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.title.x = centerX;
    this.title.y = height * 0.15;
    this.title.style.fontSize = 64;

    const labelY1 = height * 0.3;
    const valueY1 = height * 0.42;
    this.countLabel.x = centerX;
    this.countLabel.y = labelY1;
    this.countValue.x = centerX;
    this.countValue.y = valueY1;
    this.countStepper.x = centerX;
    this.countStepper.y = valueY1;

    const labelY2 = height * 0.55;
    const valueY2 = height * 0.67;
    this.distLabel.x = centerX;
    this.distLabel.y = labelY2;
    this.distValue.x = centerX;
    this.distValue.y = valueY2;
    this.distStepper.x = centerX;
    this.distStepper.y = valueY2;

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.82;
    this.startBtn.scale.set(1.0);
  }
}
