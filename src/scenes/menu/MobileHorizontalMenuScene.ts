import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";
import type { MenuContext } from "../../core";
import { getGridRect, getStandardGridConfig } from "../../core";

export class MobileHorizontalMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const grid = getStandardGridConfig(width);
    const leftCol = getGridRect(0, 6, grid);
    const rightCol = getGridRect(6, 6, grid);

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.title.x = width / 2;
    this.title.y = 40;
    this.title.style.fontSize = 32;
    this.title.scale.set(1);

    const maxTitleWidth = width - 2 * grid.margin;
    if (this.title.width > maxTitleWidth) {
      const scale = maxTitleWidth / this.title.width;
      this.title.scale.set(scale);
    }

    const centerX = width / 2;
    const leftX = leftCol.x + leftCol.width / 2;
    const rightX = rightCol.x + rightCol.width / 2;

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

    this.versionText.x = width - grid.margin;
    this.versionText.y = height - grid.margin / 2;
  }
}
