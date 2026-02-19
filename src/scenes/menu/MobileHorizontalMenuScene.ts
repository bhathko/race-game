import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";
import type { MenuContext } from "../../core";

export class MobileHorizontalMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.title.x = width / 2;
    this.title.y = 40;
    this.title.style.fontSize = 32;
    this.title.scale.set(1);

    const maxTitleWidth = width * 0.9;
    if (this.title.width > maxTitleWidth) {
      const scale = maxTitleWidth / this.title.width;
      this.title.scale.set(scale);
    }

    const centerX = width / 2;
    const leftX = width * 0.25;
    const rightX = width * 0.75;

    // Split count and distance into two columns
    this.countLabel.x = leftX;
    this.countLabel.y = height * 0.3;
    this.countValue.x = leftX;
    this.countValue.y = height * 0.48;
    this.countStepper.x = leftX;
    this.countStepper.y = height * 0.48;
    this.countStepper.scale.set(0.7);

    this.distLabel.x = rightX;
    this.distLabel.y = height * 0.3;
    this.distValue.x = rightX;
    this.distValue.y = height * 0.48;
    this.distStepper.x = rightX;
    this.distStepper.y = height * 0.48;
    this.distStepper.scale.set(0.7);

    this.funnyBtn.x = centerX;
    this.funnyBtn.y = height * 0.72;
    this.funnyBtn.scale.set(0.7);

    this.startBtn.x = centerX;
    this.startBtn.y = height - 35;
    this.startBtn.scale.set(0.65);

    this.versionText.x = width - 10;
    this.versionText.y = height - 10;
  }
}
