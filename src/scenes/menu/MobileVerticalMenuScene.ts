import { BaseMenuScene } from "./BaseMenuScene";
import { PALETTE } from "../../config";
import type { MenuContext } from "../../core";

export class MobileVerticalMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    // Title Positioning & Scaling
    this.title.x = centerX;
    this.title.y = Math.max(height * 0.12, 50); // Ensure at least 50px from top
    this.title.style.fontSize = 40;
    this.title.scale.set(1); // Reset scale first

    // Check if title is too wide
    const maxTitleWidth = width * 0.9;
    if (this.title.width > maxTitleWidth) {
      const scale = maxTitleWidth / this.title.width;
      this.title.scale.set(scale);
    }

    const labelY1 = height * 0.25;
    const valueY1 = height * 0.35;
    this.countLabel.x = centerX;
    this.countLabel.y = labelY1;
    this.countValue.x = centerX;
    this.countValue.y = valueY1;
    this.countStepper.x = centerX;
    this.countStepper.y = valueY1;
    this.countStepper.scale.set(0.85);

    const labelY2 = height * 0.47;
    const valueY2 = height * 0.57;
    this.distLabel.x = centerX;
    this.distLabel.y = labelY2;
    this.distValue.x = centerX;
    this.distValue.y = valueY2;
    this.distStepper.x = centerX;
    this.distStepper.y = valueY2;
    this.distStepper.scale.set(0.85);

    this.funnyBtn.x = centerX;
    this.funnyBtn.y = height * 0.71;
    this.funnyBtn.scale.set(0.85);

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.84;
    this.startBtn.scale.set(0.8);

    // Version Text
    this.versionText.x = width - 10;
    this.versionText.y = height - 10;
  }
}
