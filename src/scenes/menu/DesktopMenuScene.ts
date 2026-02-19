import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";
import type { MenuContext } from "../../core";

export class DesktopMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.title.x = centerX;
    this.title.y = height * 0.15;
    this.title.style.fontSize = 64;

    const labelY1 = height * 0.28;
    const valueY1 = height * 0.38;
    this.countLabel.x = centerX;
    this.countLabel.y = labelY1;
    this.countValue.x = centerX;
    this.countValue.y = valueY1;
    this.countStepper.x = centerX;
    this.countStepper.y = valueY1;

    const labelY2 = height * 0.5;
    const valueY2 = height * 0.6;
    this.distLabel.x = centerX;
    this.distLabel.y = labelY2;
    this.distValue.x = centerX;
    this.distValue.y = valueY2;
    this.distStepper.x = centerX;
    this.distStepper.y = valueY2;

    this.funnyBtn.x = centerX;
    this.funnyBtn.y = height * 0.73;

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.86;
    this.startBtn.scale.set(1.0);

    this.versionText.x = width - 20;
    this.versionText.y = height - 20;
  }
}
