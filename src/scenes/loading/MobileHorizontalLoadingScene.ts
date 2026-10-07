import { UI } from "../../config";
import { setFontSize } from "../../ui";
import { BaseLoadingScene } from "./BaseLoadingScene";
import { getGridRect, getStandardGridConfig } from "../../core";

export class MobileHorizontalLoadingScene extends BaseLoadingScene {
  public resize(width: number, height: number): void {
    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    const grid = getStandardGridConfig(width);
    const rect = getGridRect(2, 8, grid); // Span middle 8 columns

    const centerX = width / 2;
    const centerY = height / 2;

    this.loadingText.x = centerX;
    this.loadingText.y = centerY - 50;
    setFontSize(this.loadingText, 24);

    this.barWidth = rect.width;
    this.barHeight = 24;

    this.progressBg.clear();
    this.progressBg
      .roundRect(
        -this.barWidth / 2,
        -this.barHeight / 2,
        this.barWidth,
        this.barHeight,
        this.barHeight / 2,
      )
      .fill({ color: UI.SURFACE });

    this.progressBg.x = centerX;
    this.progressBg.y = centerY + 10;

    this.progressBar.x = centerX;
    this.progressBar.y = centerY + 10;

    this.percentageText.x = centerX;
    this.percentageText.y = centerY + 45;
    setFontSize(this.percentageText, 18);

    this.updateBar();
  }
}
