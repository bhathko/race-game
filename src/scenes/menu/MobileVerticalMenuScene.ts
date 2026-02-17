import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";

export class MobileVerticalMenuScene extends BaseMenuScene {
  public resize(width: number, height: number) {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.title.x = centerX;
    this.title.y = height * 0.12;
    this.title.style.fontSize = 40;

    const labelY1 = height * 0.28;
    const valueY1 = height * 0.4;
    this.countLabel.x = centerX;
    this.countLabel.y = labelY1;
    this.countValue.x = centerX;
    this.countValue.y = valueY1;
    this.countStepper.x = centerX;
    this.countStepper.y = valueY1;
    this.countStepper.scale.set(0.85);

    const labelY2 = height * 0.55;
    const valueY2 = height * 0.67;
    this.distLabel.x = centerX;
    this.distLabel.y = labelY2;
    this.distValue.x = centerX;
    this.distValue.y = valueY2;
    this.distStepper.x = centerX;
    this.distStepper.y = valueY2;
    this.distStepper.scale.set(0.85);

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.85;
    this.startBtn.scale.set(0.8);
  }
}
