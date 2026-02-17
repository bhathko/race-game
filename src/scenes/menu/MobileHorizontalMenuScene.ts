import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";

export class MobileHorizontalMenuScene extends BaseMenuScene {
  public resize(width: number, height: number) {
    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.title.x = width / 2;
    this.title.y = 40;
    this.title.style.fontSize = 32;

    const centerX = width / 2;
    const leftX = width * 0.25;
    const rightX = width * 0.75;

    // Split count and distance into two columns
    this.countLabel.x = leftX;
    this.countLabel.y = height * 0.35;
    this.countValue.x = leftX;
    this.countValue.y = height * 0.55;
    this.countStepper.x = leftX;
    this.countStepper.y = height * 0.55;
    this.countStepper.scale.set(0.7);

    this.distLabel.x = rightX;
    this.distLabel.y = height * 0.35;
    this.distValue.x = rightX;
    this.distValue.y = height * 0.55;
    this.distStepper.x = rightX;
    this.distStepper.y = height * 0.55;
    this.distStepper.scale.set(0.7);

    this.startBtn.x = centerX;
    this.startBtn.y = height - 45;
    this.startBtn.scale.set(0.65);
  }
}
